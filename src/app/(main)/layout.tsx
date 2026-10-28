import { guardPage } from "@/lib/guard";
import { BottomTabs } from "@/components/BottomTabs";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  await guardPage("app");
  return (
    <div className="min-h-dvh bg-[#ece9f0] md:py-6">
      <div className="mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-white md:h-[calc(100dvh-48px)] md:rounded-[28px] md:shadow-card">
        <main className="relative flex min-h-0 flex-1 flex-col">{children}</main>
        <BottomTabs />
      </div>
    </div>
  );
}
