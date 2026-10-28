import { android } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * Digital Asset Links: proves the Android (TWA) app and this site belong together,
 * so the app opens full-screen without a browser address bar.
 */
export function GET() {
  const body = android.packageName && android.fingerprints.length
    ? [{
        relation: ["delegate_permission/common.handle_all_urls"],
        target: { namespace: "android_app", package_name: android.packageName, sha256_cert_fingerprints: android.fingerprints },
      }]
    : [];
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
