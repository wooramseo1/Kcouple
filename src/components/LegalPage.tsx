import Link from "next/link";
import { Logo } from "./Logo";

export type LegalSection = [heading: string, body: string | string[]];

export function LegalPage({ title, note, updated, sections, children }: {
  title: string; note?: string; updated: string; sections: LegalSection[]; children?: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link href="/"><Logo className="text-xl" /></Link>
      <h1 className="mt-8 text-3xl font-extrabold">{title}</h1>
      <p className="mt-1 text-sm text-ink-500">{updated}</p>
      {note && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{note}</p>}
      {children}
      <div className="mt-6 space-y-6">
        {sections.map(([h, b]) => (
          <section key={h}>
            <h2 className="font-bold">{h}</h2>
            {Array.isArray(b) ? (
              <ul className="mt-1 list-disc space-y-1 pl-5 leading-relaxed text-ink-700">{b.map((x) => <li key={x}>{x}</li>)}</ul>
            ) : (
              <p className="mt-1 whitespace-pre-line leading-relaxed text-ink-700">{b}</p>
            )}
          </section>
        ))}
      </div>
      <nav className="mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-ink-100 pt-6 text-sm text-ink-500">
        <Link href="/terms" className="hover:underline">Terms · 이용약관</Link>
        <Link href="/privacy" className="hover:underline">Privacy · 개인정보</Link>
        <Link href="/child-safety" className="hover:underline">Child safety · 아동 안전</Link>
        <Link href="/account-deletion" className="hover:underline">Delete account · 계정 삭제</Link>
      </nav>
    </main>
  );
}
