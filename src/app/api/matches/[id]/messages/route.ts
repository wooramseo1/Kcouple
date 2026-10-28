import { json, parse, rateLimit, requireUser, route } from "@/lib/http";
import { messageSchema } from "@/lib/schemas";
import { listMessages, sendMessage } from "@/lib/services";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  const since = new URL(req.url).searchParams.get("since") ?? undefined;
  return json({ messages: listMessages((await params).id, user.id, since) });
});

export const POST = route<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  rateLimit(`msg:${user.id}`, 20, 60_000);
  const { content } = await parse(req, messageSchema);
  return json({ message: sendMessage((await params).id, user, content) }, 201);
});
