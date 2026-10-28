import { cookies, headers } from "next/headers";
import { translate, type DictKey, type Lang } from "./dict";

export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get("lang")?.value;
  if (c === "ko" || c === "en") return c;
  const accept = (await headers()).get("accept-language") ?? "";
  return accept.toLowerCase().startsWith("ko") ? "ko" : "en";
}

export async function getT() {
  const lang = await getLang();
  return { lang, t: (key: DictKey, vars?: Record<string, string | number>) => translate(lang, key, vars) };
}
