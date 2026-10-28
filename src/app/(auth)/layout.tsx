import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-gradient-to-b from-brand-50 to-white">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
        <header className="flex items-center justify-between py-5">
          <Link href="/"><Logo className="text-xl" /></Link>
          <LangToggle />
        </header>
        <div className="flex-1 pb-10">{children}</div>
      </div>
    </main>
  );
}
