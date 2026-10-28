"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";

export function DeleteAccountButton({ email, ko }: { email: string; ko: boolean }) {
  const [done, setDone] = useState(false);
  async function remove() {
    if (!confirm(ko ? "계정을 삭제할까요? 되돌릴 수 없습니다." : "Delete your account? This cannot be undone.")) return;
    await api("/api/account", { method: "DELETE" });
    setDone(true);
  }
  if (done) return <p className="text-sm font-semibold text-emerald-700">{ko ? "계정이 삭제되었습니다." : "Your account has been deleted."}</p>;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-ink-700">{email}</span>
      <button onClick={remove} className="btn h-10 bg-rose-600 px-4 text-sm text-white">{ko ? "지금 계정 삭제" : "Delete my account now"}</button>
    </div>
  );
}
