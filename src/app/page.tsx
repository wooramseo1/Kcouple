import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, nextStep } from "@/lib/auth";
import { getT } from "@/i18n/server";
import { Logo } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";
import { Photo } from "@/components/Photo";
import { IconChat, IconGlobe, IconHeart, IconShield } from "@/components/Icons";

export default async function Landing() {
  const user = await currentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : (nextStep(user) ?? "/discover"));
  const { t } = await getT();
  const features = [
    { icon: <IconHeart className="h-5 w-5" />, title: t("landing.f1"), desc: t("landing.f1d") },
    { icon: <IconGlobe className="h-5 w-5" />, title: t("landing.f2"), desc: t("landing.f2d") },
    { icon: <IconShield className="h-5 w-5" />, title: t("landing.f3"), desc: t("landing.f3d") },
  ];
  return (
    <main className="min-h-dvh bg-gradient-to-b from-brand-50 via-white to-white">
      <div className="mx-auto max-w-5xl px-5">
        <header className="flex items-center justify-between py-5">
          <Logo className="text-2xl" />
          <LangToggle />
        </header>

        <section className="grid items-center gap-10 py-6 md:grid-cols-2 md:py-16">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600">{t("app.tagline")}</p>
            <h1 className="whitespace-pre-line text-[34px] font-extrabold leading-[1.15] tracking-tight md:text-5xl">{t("landing.title")}</h1>
            <p className="mt-4 text-lg text-ink-500">{t("landing.sub")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="btn-primary text-base">{t("landing.create")}</Link>
              <Link href="/login" className="btn-ghost text-base">{t("landing.login")}</Link>
            </div>
            <p className="mt-4 text-xs text-ink-500">{t("landing.disclaimer")}</p>
          </div>

          {/* Decorative card stack */}
          <div className="relative mx-auto h-[420px] w-[290px]" aria-hidden>
            <div className="absolute inset-0 -rotate-6 translate-x-[-28px] overflow-hidden rounded-3xl shadow-card">
              <Photo src="demo:200:☕" alt="" className="h-full w-full" />
            </div>
            <div className="absolute inset-0 rotate-[5deg] translate-x-[26px] overflow-hidden rounded-3xl shadow-card">
              <Photo src="demo:20:✈️" alt="" className="h-full w-full" />
            </div>
            <div className="absolute inset-0 overflow-hidden rounded-3xl shadow-card">
              <Photo src="demo:335:🌸" alt="" className="h-full w-full" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
                <div className="text-2xl font-bold">지우 <span className="font-normal">27</span></div>
                <div className="text-sm opacity-90">🇰🇷 Seoul · 한국어 · English</div>
              </div>
              <div className="absolute left-5 top-6 -rotate-12 rounded-lg border-4 border-emerald-400 px-2 text-2xl font-black text-emerald-400">LIKE</div>
            </div>
            <div className="absolute -bottom-6 left-1/2 flex -translate-x-1/2 gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-rose-500 shadow-card"><IconHeart /></span>
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-sky-500 shadow-card"><IconChat /></span>
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-16 pt-6 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-5">
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">{f.icon}</div>
              <div className="font-bold">{f.title}</div>
              <div className="mt-1 text-sm text-ink-500">{f.desc}</div>
            </div>
          ))}
        </section>

        <footer className="flex flex-wrap gap-x-4 gap-y-2 border-t border-ink-100 py-6 text-xs text-ink-500">
          <Link href="/terms" className="hover:underline">{t("settings.terms")}</Link>
          <Link href="/privacy" className="hover:underline">{t("settings.policy")}</Link>
          <Link href="/child-safety" className="hover:underline">{t("settings.childSafety")}</Link>
          <Link href="/account-deletion" className="hover:underline">{t("settings.delete")}</Link>
        </footer>
      </div>
    </main>
  );
}
