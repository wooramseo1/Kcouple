import { redirect } from "next/navigation";
import { currentUser, nextStep } from "./auth";
import type { User } from "./types";

/** Server-side page guard: sends the user to the right step of the funnel. */
export async function guardPage(stage: "app" | "verify-age" | "onboarding" | "admin"): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.status === "suspended") redirect("/login?suspended=1");
  if (stage === "admin") {
    if (user.role !== "admin") redirect("/discover");
    return user;
  }
  if (user.role === "admin" && stage === "app") redirect("/admin");
  const step = nextStep(user);
  if (stage === "app" && step) redirect(step);
  if (stage === "verify-age" && user.ageVerified) redirect(step ?? "/discover");
  if (stage === "onboarding" && step !== "/onboarding") redirect(step ?? "/discover");
  return user;
}
