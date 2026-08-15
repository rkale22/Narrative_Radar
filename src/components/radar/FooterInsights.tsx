"use client";

import type { RadarReport } from "@/lib/radar";

export function FooterInsights({ report }: { report: RadarReport }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="panel relative overflow-hidden rounded-2xl px-5 py-5">
        <div className="absolute inset-y-0 left-0 w-[3px] bg-[#e25b4a]" />
        <div className="text-[11px] font-semibold tracking-[0.28em] text-[#e25b4a]">COLLISION</div>
        <p className="mt-2 text-[17px] leading-snug text-white">{report.collision}</p>
      </div>
      <div className="panel rounded-2xl px-5 py-5">
        <div className="text-[11px] font-semibold tracking-[0.28em] text-[#3ee0d6]">WATCH FOR</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {report.watchFor.map((item) => (
            <span
              key={item}
              className="rounded-full bg-[#3ee0d6]/10 px-3 py-1.5 text-[13px] text-[#d7f8f5] ring-1 ring-[#3ee0d6]/20"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
