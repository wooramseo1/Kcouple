import { currentUser } from "@/lib/auth";
import { member, toPublic } from "@/lib/services";
import { MeView } from "./MeView";

export default async function MePage() {
  const user = (await currentUser())!;
  return <MeView profile={toPublic(member(user.id)!)} />;
}
