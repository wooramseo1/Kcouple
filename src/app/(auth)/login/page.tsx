import { Suspense } from "react";
import { isDemoMode } from "@/lib/config";
import { LoginForm } from "./LoginForm";

// Demo logins depend on runtime env, so do not prerender at build time.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <Suspense><LoginForm demo={isDemoMode()} /></Suspense>;
}
