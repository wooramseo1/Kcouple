// Renders PNG app icons and Play Store graphics from inline SVG with the
// preinstalled Playwright Chromium. Run: node scripts/generate-icons.mjs
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

// Playwright is preinstalled globally in the build container rather than a project dependency.
const { chromium } = createRequire(import.meta.url)("playwright");

const heart = (fill, opacity = 1) =>
  `<path d="M24 46s-12-7.4-12-16a7 7 0 0 1 12-4.9A7 7 0 0 1 36 30c0 8.6-12 16-12 16z" fill="${fill}" opacity="${opacity * 0.75}"/>
   <path d="M40 50s-12-7.4-12-16a7 7 0 0 1 12-4.9A7 7 0 0 1 52 34c0 8.6-12 16-12 16z" fill="${fill}" opacity="${opacity}"/>`;
const grad = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fd4a6c"/><stop offset="1" stop-color="#ff7a59"/></linearGradient></defs>`;

// "any" icon: rounded tile. "maskable": full-bleed, artwork inside the 80% safe zone.
const anyIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${grad}<rect width="64" height="64" rx="14" fill="url(#g)"/><g transform="translate(-2 -6)">${heart("#fff")}</g></svg>`;
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${grad}<rect width="64" height="64" fill="url(#g)"/><g transform="translate(9.6 6) scale(.7)">${heart("#fff")}</g></svg>`;
const feature = `<div style="width:1024px;height:500px;display:flex;align-items:center;gap:48px;padding:0 80px;box-sizing:border-box;
  background:linear-gradient(135deg,#fd4a6c,#ff7a59);font-family:system-ui,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#fff">
  <svg viewBox="0 0 64 64" width="220" height="220"><g transform="translate(-2 -6)">${heart("#fff")}</g></svg>
  <div><div style="font-size:84px;font-weight:900;letter-spacing:-2px">K-Couple</div>
  <div style="font-size:34px;font-weight:600;opacity:.95;margin-top:8px">Connect Hearts Beyond Borders</div>
  <div style="font-size:28px;opacity:.9;margin-top:6px">국경을 넘어 마음을 잇다</div></div></div>`;

const out = new URL("../public/icons/", import.meta.url).pathname;
const store = new URL("../docs/play-store/", import.meta.url).pathname;
mkdirSync(out, { recursive: true });
mkdirSync(store, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
async function render(html, size, path) {
  await page.setViewportSize(size);
  await page.setContent(`<html><body style="margin:0;background:transparent">${html.startsWith("<svg") ? html.replace("<svg ", `<svg width="${size.width}" height="${size.height}" `) : html}</body></html>`);
  await page.screenshot({ path, omitBackground: true, clip: { x: 0, y: 0, ...size } });
}
for (const s of [192, 512]) {
  await render(anyIcon, { width: s, height: s }, `${out}icon-${s}.png`);
  await render(maskable, { width: s, height: s }, `${out}maskable-${s}.png`);
}
await render(anyIcon, { width: 180, height: 180 }, `${out}apple-touch-icon.png`);
await render(maskable, { width: 512, height: 512 }, `${store}app-icon-512.png`);
await render(feature, { width: 1024, height: 500 }, `${store}feature-graphic-1024x500.png`);
await browser.close();
console.log("icons written");
