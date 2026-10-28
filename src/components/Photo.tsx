/* eslint-disable @next/next/no-img-element */

/** Renders an uploaded photo or a seeded "demo:<hue>:<emoji>" placeholder. */
export function Photo({ src, alt, className = "", emojiSize = "text-[96px]" }: { src?: string; alt: string; className?: string; emojiSize?: string }) {
  if (src?.startsWith("demo:")) {
    const [, hue, emoji] = src.split(":");
    const h = Number(hue);
    return (
      <div
        role="img"
        aria-label={alt}
        className={`relative flex items-center justify-center overflow-hidden ${className}`}
        style={{
          background: `radial-gradient(circle at 30% 20%, hsl(${h} 95% 82%) 0%, transparent 55%),
            radial-gradient(circle at 80% 85%, hsl(${(h + 40) % 360} 85% 70%) 0%, transparent 60%),
            linear-gradient(160deg, hsl(${h} 75% 66%), hsl(${(h + 25) % 360} 70% 48%))`,
        }}
      >
        <span className={`${emojiSize} drop-shadow-[0_8px_24px_rgba(0,0,0,.25)] select-none`}>{emoji}</span>
      </div>
    );
  }
  if (!src) return <div className={`bg-ink-100 ${className}`} aria-label={alt} />;
  return <img src={src} alt={alt} draggable={false} className={`object-cover ${className}`} />;
}
