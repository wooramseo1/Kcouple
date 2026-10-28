"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { api } from "@/lib/api-client";
import { AboutFields, BasicsFields, GoalField, LanguagesField, PhotoManager, type ProfileDraft } from "@/components/ProfileFields";
import { IconBack } from "@/components/Icons";

export default function EditProfilePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<{ profile: ProfileDraft & { photos: string[] } }>("/api/profile/me").then(({ profile: p }) => {
      setPhotos(p.photos);
      setDraft({ nickname: p.nickname, gender: p.gender, group: p.group, nationality: p.nationality, city: p.city, languages: p.languages, goal: p.goal, bio: p.bio, interests: p.interests, isVisible: p.isVisible });
    });
  }, []);

  const set = (patch: Partial<ProfileDraft>) => { setSaved(false); setDraft((d) => (d ? { ...d, ...patch } : d)); };

  async function save() {
    if (!draft) return;
    setBusy(true);
    try {
      await api("/api/profile/me", { method: "PUT", body: { profile: draft } });
      setSaved(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-ink-100 px-2 py-2">
        <Link href="/me" className="grid h-10 w-10 place-items-center rounded-full text-ink-700 hover:bg-ink-100" aria-label="back"><IconBack /></Link>
        <h1 className="font-bold">{t("me.edit")}</h1>
        <button className="h-10 px-3 font-bold text-brand-600 disabled:opacity-40" disabled={busy || !draft || !draft.nickname.trim() || !draft.interests.length} onClick={save}>
          {saved ? t("me.saved") : t("me.save")}
        </button>
      </header>
      {!draft ? (
        <div className="p-5 text-sm text-ink-500">{t("common.loading")}</div>
      ) : (
        <div className="no-scrollbar flex-1 space-y-8 overflow-y-auto p-5">
          <Block title={t("me.photos")}><PhotoManager photos={photos} onChange={setPhotos} /></Block>
          <Block title={t("ob.about")}><AboutFields value={draft} set={set} /></Block>
          <Block title={t("ob.goal")}><GoalField value={draft} set={set} /></Block>
          <Block title={t("ob.languages")}><LanguagesField value={draft} set={set} /></Block>
          <Block title={t("ob.basics")}><BasicsFields value={draft} set={set} /></Block>
          <button className="btn-primary w-full" disabled={busy || !draft.nickname.trim() || !draft.interests.length} onClick={save}>{saved ? t("me.saved") : t("me.save")}</button>
        </div>
      )}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-3 text-lg font-extrabold">{title}</h2>{children}</section>;
}
