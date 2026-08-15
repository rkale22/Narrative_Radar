"use client";

import type { RadarReport } from "@/lib/radar";

export function PulseBanner({ report }: { report: RadarReport }) {
  return (
    <section className="panel relative overflow-hidden rounded-2xl px-6 py-5">
      <div className="absolute inset-y-0 left-0 w-[3px] bg-[#3ee0d6]" />
      <div className="pointer-events-none absolute right-6 top-1/2 h-28 w-28 -translate-y-1/2 opacity-40">
        <svg viewBox="0 0 120 120" className="h-full w-full text-[#3ee0d6]" fill="none">
          <circle cx="60" cy="60" r="52" stroke="currentColor" strokeWidth="1" opacity="0.35" />
          <circle cx="60" cy="60" r="34" stroke="currentColor" strokeWidth="1" opacity="0.45" />
          <circle cx="60" cy="60" r="16" stroke="currentColor" strokeWidth="1" opacity="0.7" />
          <circle cx="78" cy="44" r="3" fill="#3ee07a" />
          <circle cx="48" cy="70" r="2.5" fill="#e0a03e" />
          <circle cx="86" cy="72" r="2" fill="#e25b4a" />
          <circle cx="40" cy="42" r="2" fill="#3ee0d6" />
        </svg>
      </div>
      <div className="text-[11px] font-semibold tracking-[0.28em] text-[#3ee0d6]">PULSE</div>
      <p className="mt-2 max-w-4xl text-[26px] font-medium leading-snug tracking-tight text-white">
        {report.pulse}
      </p>
      <p className="mt-3 text-[13px] text-[#8b93a0]">
        {report.narratives.length} competing narrative{report.narratives.length === 1 ? "" : "s"}
        {` · last ${report.window}`}
        {report.diagnostics?.evidenceThin ? " · not enough disagreement to cluster" : ""}
      </p>
    </section>
  );
}
