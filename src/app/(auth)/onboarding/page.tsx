import { guardPage } from "@/lib/guard";
import { db } from "@/lib/db";
import { Onboarding } from "./Onboarding";

export default async function OnboardingPage() {
  const user = await guardPage("onboarding");
  const pending = db().profiles.find((p) => p.userId === user.id);
  return <Onboarding initialPhotos={pending?.photos ?? []} />;
}
