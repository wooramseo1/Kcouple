import { z } from "zod";
import { CITIES, COUNTRIES, GENDERS, GOALS, INTERESTS, LANGUAGES, LANG_LEVELS, MIN_AGE, REPORT_REASONS } from "./constants";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(128),
  acceptTerms: z.literal(true),
  acceptPrivacy: z.literal(true),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

export const verifyAgeSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  confirmAdult: z.literal(true),
});

export const languageSchema = z.object({
  code: z.enum(LANGUAGES),
  level: z.enum(LANG_LEVELS as [string, ...string[]]),
});

export const profileSchema = z.object({
  nickname: z.string().trim().min(1).max(30),
  gender: z.enum(GENDERS as [string, ...string[]]),
  group: z.enum(["korean", "foreigner"]),
  nationality: z.enum(COUNTRIES),
  city: z.string().refine((c) => c in CITIES, "unknown city"),
  languages: z.array(languageSchema).min(1).max(5),
  goal: z.enum(GOALS as [string, ...string[]]),
  bio: z.string().trim().max(500),
  interests: z.array(z.enum(INTERESTS)).min(1).max(8),
  isVisible: z.boolean(),
});

export const preferencesSchema = z
  .object({
    preferredGenders: z.array(z.enum(GENDERS as [string, ...string[]])).min(1),
    minAge: z.number().int().min(MIN_AGE).max(99),
    maxAge: z.number().int().min(MIN_AGE).max(99),
    lookingFor: z.enum(["korean", "foreigner", "any"]),
  })
  .refine((p) => p.maxAge >= p.minAge, { message: "maxAge must be >= minAge", path: ["maxAge"] });

export const profileUpdateSchema = z.object({
  profile: profileSchema.partial().optional(),
  preferences: preferencesSchema.optional(),
});

export const onboardingSchema = z.object({ profile: profileSchema, preferences: preferencesSchema });

export const photoSchema = z.object({
  dataUrl: z.string().regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "unsupported image"),
});

export const photoOrderSchema = z.object({ order: z.array(z.number().int().min(0)).max(6) });

export const swipeSchema = z.object({
  target_user_id: z.string().uuid(),
  action: z.enum(["like", "pass"]),
});

export const messageSchema = z.object({ content: z.string().max(2000) });

export const reportSchema = z.object({
  target_user_id: z.string().uuid(),
  match_id: z.string().uuid().nullable().optional(),
  reason: z.enum(REPORT_REASONS as [string, ...string[]]),
  detail: z.string().trim().max(1000).default(""),
  also_block: z.boolean().default(false),
});

export const reportUpdateSchema = z.object({
  status: z.enum(["reviewing", "actioned", "dismissed"]),
  resolution: z.string().trim().max(500).optional(),
  user_action: z.enum(["none", "warn", "suspend", "ban"]).default("none"),
});

export const userStatusSchema = z.object({ status: z.enum(["active", "suspended"]) });
