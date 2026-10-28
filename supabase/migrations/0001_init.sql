-- K-Couple initial schema for Supabase PostgreSQL (PRD §7, Appendix A).
-- Mirrors src/lib/types.ts. Apply with `supabase db push`.

create extension if not exists pgcrypto;

-- ---------- Core tables ----------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  status varchar(20) not null default 'pending' check (status in ('pending','active','suspended','deleted')),
  role varchar(20) not null default 'user' check (role in ('user','moderator','analyst','admin')),
  age_verified boolean not null default false,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  nickname varchar(30) not null,
  birth_date date not null,                       -- private; only age is exposed
  gender varchar(20) not null check (gender in ('female','male','nonbinary')),
  user_group varchar(20) not null check (user_group in ('korean','foreigner')),
  nationality char(2) not null,
  residence_city varchar(100) not null,
  relationship_goal varchar(20) not null check (relationship_goal in ('serious','long_term','casual','open')),
  bio text check (char_length(bio) <= 500),
  is_visible boolean not null default false,
  check (birth_date <= (current_date - interval '19 years'))
);

create table public.profile_languages (
  user_id uuid references public.users(id) on delete cascade,
  code varchar(5) not null,
  level varchar(20) not null check (level in ('basic','conversational','fluent','native')),
  primary key (user_id, code)
);

create table public.preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  preferred_genders text[] not null,
  min_age integer not null default 20,
  max_age integer not null default 40,
  looking_for varchar(20) not null default 'any' check (looking_for in ('korean','foreigner','any')),
  check (min_age >= 19 and max_age >= min_age)
);

create table public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  object_path text not null,                      -- private Storage bucket; serve via signed URLs
  sort_order smallint not null default 0,
  review_status varchar(20) not null default 'pending' check (review_status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create index on public.profile_photos (user_id, sort_order);

create table public.interests (id serial primary key, code varchar(30) unique not null);
create table public.user_interests (
  user_id uuid references public.users(id) on delete cascade,
  interest_id int references public.interests(id),
  primary key (user_id, interest_id)
);

create table public.likes (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.users(id) on delete cascade,
  to_user_id uuid not null references public.users(id) on delete cascade,
  action varchar(10) not null check (action in ('like','pass')),
  created_at timestamptz not null default now(),
  unique (from_user_id, to_user_id),
  check (from_user_id <> to_user_id)
);
create index on public.likes (to_user_id) where action = 'like';

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references public.users(id) on delete cascade,
  user2_id uuid not null references public.users(id) on delete cascade,
  status varchar(20) not null default 'active' check (status in ('active','unmatched','blocked')),
  created_at timestamptz not null default now(),
  check (user1_id < user2_id),
  unique (user1_id, user2_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index on public.messages (match_id, created_at);

create table public.blocks (
  blocker_id uuid references public.users(id) on delete cascade,
  blocked_id uuid references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id),
  target_id uuid not null references public.users(id),
  match_id uuid references public.matches(id),
  reason varchar(20) not null check (reason in ('fake','harassment','sexual','scam','spam','underage','other')),
  detail text,
  status varchar(20) not null default 'open' check (status in ('open','reviewing','actioned','dismissed')),
  handled_by uuid references public.users(id),
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.verification_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  method varchar(50) not null,
  status varchar(20) not null check (status in ('passed','failed')),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action varchar(60) not null,
  target_id uuid,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- ---------- Helpers ----------
create or replace function public.is_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from users where id = auth.uid() and role in ('admin','moderator'));
$$;

-- Like/Pass + mutual match in one transaction (PRD §4.2, Appendix B).
create or replace function public.process_swipe(target uuid, act text)
returns table (matched boolean, match_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  u1 uuid := least(me, target);
  u2 uuid := greatest(me, target);
  mid uuid;
begin
  if me is null or me = target then raise exception 'invalid'; end if;
  if is_blocked(me, target) then raise exception 'not_eligible'; end if;
  -- Server-side re-check of both users' status and mutual preferences belongs here (see src/lib/matching.ts).

  insert into likes (from_user_id, to_user_id, action) values (me, target, act)
  on conflict (from_user_id, to_user_id) do update set action = excluded.action, created_at = now();

  if act = 'like' and exists (select 1 from likes where from_user_id = target and to_user_id = me and action = 'like') then
    insert into matches (user1_id, user2_id) values (u1, u2)
    on conflict (user1_id, user2_id) do nothing
    returning id into mid;
    if mid is null then select id into mid from matches where user1_id = u1 and user2_id = u2; end if;
    return query select true, mid;
  else
    return query select false, null::uuid;
  end if;
end $$;

-- ---------- Row Level Security ----------
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_languages enable row level security;
alter table public.preferences enable row level security;
alter table public.profile_photos enable row level security;
alter table public.user_interests enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.verification_records enable row level security;
alter table public.audit_logs enable row level security;

create policy own_user on public.users for select using (id = auth.uid() or is_admin());

-- Profiles are readable directly only by their owner; discovery goes through the
-- API, which returns a public projection without birth_date.
create policy own_profile on public.profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_langs on public.profile_languages for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_prefs on public.preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_photos on public.profile_photos for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_interests on public.user_interests for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Likes are written only via process_swipe(); users may read their own outgoing swipes.
create policy own_likes on public.likes for select using (from_user_id = auth.uid());

create policy match_participants on public.matches for select
  using (auth.uid() in (user1_id, user2_id));
create policy match_unmatch on public.matches for update
  using (auth.uid() in (user1_id, user2_id)) with check (status in ('unmatched','blocked'));

create policy read_messages on public.messages for select using (
  exists (select 1 from matches m where m.id = match_id and auth.uid() in (m.user1_id, m.user2_id))
);
create policy send_messages on public.messages for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from matches m join users u1 on u1.id = m.user1_id join users u2 on u2.id = m.user2_id
    where m.id = match_id and m.status = 'active' and auth.uid() in (m.user1_id, m.user2_id)
      and u1.status = 'active' and u2.status = 'active'
      and not is_blocked(m.user1_id, m.user2_id)
  )
);

create policy own_blocks on public.blocks for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy create_report on public.reports for insert with check (reporter_id = auth.uid());
create policy admin_reports on public.reports for all using (is_admin());
create policy own_verification on public.verification_records for select using (user_id = auth.uid());
create policy admin_audit on public.audit_logs for select using (is_admin());

-- Realtime for chat
alter publication supabase_realtime add table public.messages;
