export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-extrabold tracking-tight ${className}`}>
      <svg viewBox="0 0 64 64" className="h-[1.3em] w-[1.3em]" aria-hidden>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fd4a6c" /><stop offset="1" stopColor="#ff7a59" /></linearGradient>
        </defs>
        <path d="M24 46s-12-7.4-12-16a7 7 0 0 1 12-4.9A7 7 0 0 1 36 30c0 8.6-12 16-12 16z" fill="url(#lg)" opacity=".55" />
        <path d="M40 50s-12-7.4-12-16a7 7 0 0 1 12-4.9A7 7 0 0 1 52 34c0 8.6-12 16-12 16z" fill="url(#lg)" />
      </svg>
      <span className="text-gradient">K-Couple</span>
    </span>
  );
}
