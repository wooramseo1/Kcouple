import { db, save } from "@/lib/db";
import { HttpError, json, parse, rateLimit, requireUser, route } from "@/lib/http";
import { MAX_PHOTOS, MAX_PHOTO_BYTES } from "@/lib/constants";
import { photoOrderSchema, photoSchema } from "@/lib/schemas";
import type { Profile } from "@/lib/types";

/** Photos may be uploaded during onboarding, before the full profile exists. */
function ownProfile(userId: string, create: boolean): Profile | undefined {
  const d = db();
  let p = d.profiles.find((x) => x.userId === userId);
  if (!p && create) {
    p = {
      userId, nickname: "", birthDate: "", gender: "female", group: "foreigner", nationality: "US", city: "Seoul",
      languages: [], goal: "open", bio: "", interests: [], photos: [], isVisible: false,
    };
    d.profiles.push(p);
  }
  return p;
}

const MAGIC: Record<string, (b: Buffer) => boolean> = {
  jpeg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  png: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  webp: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP",
};

export const POST = route(async (req) => {
  const user = await requireUser();
  rateLimit(`photo:${user.id}`, 20, 60_000);
  const { dataUrl } = await parse(req, photoSchema);
  const kind = dataUrl.slice(11, dataUrl.indexOf(";"));
  const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
  if (bytes.length > MAX_PHOTO_BYTES) throw new HttpError(413, "photo_too_large");
  // Check the actual file signature, not just the declared MIME type.
  if (!MAGIC[kind]?.(bytes)) throw new HttpError(400, "invalid_image");
  const profile = ownProfile(user.id, true)!;
  if (profile.photos.length >= MAX_PHOTOS) throw new HttpError(400, "too_many_photos");
  profile.photos.push(dataUrl);
  save();
  return json({ success: true, count: profile.photos.length }, 201);
});

export const DELETE = route(async (req) => {
  const user = await requireUser();
  const index = Number(new URL(req.url).searchParams.get("index"));
  const profile = ownProfile(user.id, false);
  if (!profile || !Number.isInteger(index) || !profile.photos[index]) throw new HttpError(404, "photo_not_found");
  if (profile.photos.length === 1 && profile.nickname) throw new HttpError(400, "last_photo");
  profile.photos.splice(index, 1);
  save();
  return json({ success: true });
});

/** Reorder: body.order is a permutation of current indexes; first photo is the main one. */
export const PATCH = route(async (req) => {
  const user = await requireUser();
  const { order } = await parse(req, photoOrderSchema);
  const profile = ownProfile(user.id, false);
  if (!profile) throw new HttpError(404, "profile_not_found");
  const valid = order.length === profile.photos.length && new Set(order).size === order.length && order.every((i) => i < order.length);
  if (!valid) throw new HttpError(400, "invalid_order");
  profile.photos = order.map((i) => profile.photos[i]);
  save();
  return json({ success: true });
});
