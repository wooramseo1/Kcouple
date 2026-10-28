import { guardPage } from "@/lib/guard";
import { AdminConsole } from "./AdminConsole";

export default async function AdminPage() {
  await guardPage("admin");
  return <AdminConsole />;
}
