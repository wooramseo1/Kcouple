import { guardPage } from "@/lib/guard";
import { VerifyAgeForm } from "./VerifyAgeForm";

export default async function VerifyAgePage() {
  await guardPage("verify-age");
  return <VerifyAgeForm />;
}
