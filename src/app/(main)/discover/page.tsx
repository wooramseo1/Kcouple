import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { member } from "@/lib/services";
import { Logo } from "@/components/Logo";
import { SwipeDeck } from "@/components/SwipeDeck";
import { IconGear } from "@/components/Icons";

export default async function DiscoverPage() {
  const user = (await currentUser())!;
  const me = member(user.id)!;
  return (
    <>
      <header className="flex items-center justify-between px-4 py-3">
        <Logo className="text-xl" />
        <Link href="/settings" className="grid h-10 w-10 place-items-center rounded-full text-ink-500 hover:bg-ink-100" aria-label="settings">
          <IconGear className="h-5 w-5" />
        </Link>
      </header>
      <SwipeDeck me={{ nickname: me.profile.nickname, photo: me.profile.photos[0] }} />
    </>
  );
}
