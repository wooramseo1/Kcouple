/**
 * Deployment settings read from environment variables. See .env.example.
 */

/**
 * Demo mode seeds sample profiles that auto-like and auto-reply, plus shared demo logins.
 * Fake interactive profiles are deceptive in a real dating service (Play "Deceptive Behavior"
 * policy), so demo mode is on by default only outside production.
 */
export function isDemoMode(): boolean {
  const v = process.env.DEMO_MODE;
  if (v === "true") return true;
  if (v === "false") return false;
  return process.env.NODE_ENV !== "production";
}

const CONTACT_EMAIL = "inbroad.global@gmail.com";

export const site = {
  name: "K-Couple",
  url: process.env.SITE_URL ?? "http://localhost:3000",
  supportEmail: process.env.SUPPORT_EMAIL ?? CONTACT_EMAIL,
  /** 개인정보 보호책임자 (Korean PIPA requires naming the privacy officer). */
  privacyOfficer: process.env.PRIVACY_OFFICER ?? "서우람",
  /** Child-safety point of contact required by Play's Child Safety Standards policy. */
  childSafetyEmail: process.env.CHILD_SAFETY_EMAIL ?? process.env.SUPPORT_EMAIL ?? CONTACT_EMAIL,
  operator: process.env.OPERATOR_NAME ?? "인브로드",
};

/** Android app identity for Digital Asset Links (Trusted Web Activity). */
export const android = {
  packageName: process.env.ANDROID_PACKAGE_NAME ?? "",
  /** Comma-separated SHA-256 signing-certificate fingerprints (upload key and Play App Signing key). */
  fingerprints: (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
};
