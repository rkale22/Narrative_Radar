export const WINDOWS = ["6h", "24h", "7d"] as const;

export const trajectoryStyle = {
  rising: {
    chip: "bg-[#3ee07a]/12 text-[#3ee07a] ring-[#3ee07a]/25",
    bar: "bg-[#3ee0d6]",
    label: "Rising",
  },
  stable: {
    chip: "bg-[#e0a03e]/12 text-[#e0a03e] ring-[#e0a03e]/25",
    bar: "bg-[#e0a03e]",
    label: "Stable",
  },
  fading: {
    chip: "bg-white/6 text-[#9aa3b0] ring-white/10",
    bar: "bg-[#6f7886]",
    label: "Fading",
  },
} as const;

export function displayHandle(handle: string): string {
  return `@${handle.replace(/^@/, "")}`;
}

export function timeAgo(iso?: string): string {
  if (!iso) return "just now";
  const delta = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.round(delta / 60_000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function handleColor(handle: string): string {
  let hash = 0;
  for (const char of handle) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const hues = [168, 198, 32, 12, 145, 260, 210];
  return `hsl(${hues[hash % hues.length]} 42% 38%)`;
}

export function initials(handle: string): string {
  const cleaned = handle.replace(/^@/, "");
  return cleaned.slice(0, 2).toUpperCase();
}

export function RadarMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
