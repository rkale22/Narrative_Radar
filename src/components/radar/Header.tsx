"use client";

import { RadarMark } from "@/components/radar/icons";

export function Header() {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full hairline bg-white/3 text-[#3ee0d6]">
          <RadarMark className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[15px] font-semibold tracking-[0.18em] text-white">
            NARRATIVE RADAR
          </div>
          <div className="text-[11px] tracking-wide text-[#8b93a0]">
            live X narratives via Grok
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[12px] text-[#9aa3b0]">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#3ee07a]/10 px-2.5 py-1 text-[#3ee07a] ring-1 ring-[#3ee07a]/20">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3ee07a] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3ee07a]" />
          </span>
          Live
        </span>
        <span>powered by grok-4.6</span>
      </div>
    </header>
  );
}
