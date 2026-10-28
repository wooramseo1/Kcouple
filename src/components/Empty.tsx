import Link from "next/link";
import { IconHeart } from "./Icons";

export function Empty({ title, sub, cta }: { title: string; sub: string; cta: string }) {
  return (
    <div className="flex flex-col items-center px-10 pt-24 text-center">
      <div className="mb-5 grid h-20 w-20 place-items-center rounded-full bg-brand-50 text-brand-500"><IconHeart className="h-10 w-10" /></div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-ink-500">{sub}</p>
      <Link href="/discover" className="btn-primary mt-6 h-11 text-sm">{cta}</Link>
    </div>
  );
}
