"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { displayHandle, handleColor, initials, trajectoryStyle } from "@/components/radar/icons";
import type { RadarNarrative, RadarReport } from "@/lib/radar";

export function NarrativeCard({
  narrative,
  dimmed,
  onOpen,
}: {
  narrative: RadarNarrative;
  dimmed?: boolean;
  onOpen: () => void;
}) {
  const style = trajectoryStyle[narrative.trajectory];
  const receiptCount = narrative.receipts.length;
  const amplifierCount = narrative.amplifiers.length;

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-expanded={false}
      onClick={onOpen}
      onKeyDown={onKeyDown}
      className={`panel flex h-full cursor-pointer flex-col rounded-2xl p-5 outline-none transition-all duration-300 ${
        dimmed ? "opacity-40" : "hover:ring-1 hover:ring-[#3ee0d6]/25"
      }`}
    >
      <span
        className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ring-1 ${style.chip}`}
      >
        {style.label}
      </span>
      <h2 className="mt-3 text-[20px] font-semibold leading-snug text-white">{narrative.label}</h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[#9aa3b0]">{narrative.thesis}</p>

      <div className="mt-5">
        <div className="flex items-center justify-between text-[12px] text-[#8b93a0]">
          <span>Share of conversation</span>
          <span className="font-medium text-white">{narrative.sharePct}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${narrative.sharePct}%` }} />
        </div>
      </div>

      <p className="mt-auto pt-4 text-[11px] tracking-wide text-[#8b93a0]">
        Click to expand · {amplifierCount} amplifier{amplifierCount === 1 ? "" : "s"} · {receiptCount}{" "}
        receipt{receiptCount === 1 ? "" : "s"}
      </p>
    </article>
  );
}

function ExpandedNarrative({
  narrative,
  onClose,
}: {
  narrative: RadarNarrative;
  onClose: () => void;
}) {
  const style = trajectoryStyle[narrative.trajectory];

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  function stopLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation();
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-expanded={true}
      onClick={onClose}
      onKeyDown={onKeyDown}
      className="panel flex h-full cursor-pointer flex-col overflow-auto rounded-2xl bg-[#10151c] p-6 ring-1 ring-[#3ee0d6]/35 shadow-[0_30px_80px_rgba(0,0,0,0.65)] outline-none"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span
          className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ring-1 ${style.chip}`}
        >
          {style.label}
        </span>
        <span className="text-[11px] tracking-wide text-[#8b93a0]">Click to close</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div>
          <h2 className="text-[28px] font-semibold leading-snug text-white">{narrative.label}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#9aa3b0]">{narrative.thesis}</p>

          <div className="mt-6">
            <div className="flex items-center justify-between text-[12px] text-[#8b93a0]">
              <span>Share of conversation</span>
              <span className="font-medium text-white">{narrative.sharePct}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
              <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${narrative.sharePct}%` }} />
            </div>
          </div>

          <div className="mt-8">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-[#8b93a0]">AMPLIFIERS</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {narrative.amplifiers.map((amp) => (
                <span
                  key={amp.handle}
                  title={amp.why}
                  className="rounded-full bg-white/4 px-3 py-1.5 text-[13px] text-[#d5dbe3] ring-1 ring-white/8"
                >
                  {displayHandle(amp.handle)}
                </span>
              ))}
            </div>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-[#8b93a0]">
              {narrative.amplifiers.map((amp) => (
                <li key={`${amp.handle}-why`}>
                  <span className="text-white">{displayHandle(amp.handle)}</span>
                  {" — "}
                  {amp.why}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold tracking-[0.18em] text-[#8b93a0]">RECEIPTS</div>
          <div className="mt-3 flex flex-col gap-3">
            {narrative.receipts.map((receipt) => (
              <a
                key={receipt.url}
                href={receipt.url}
                target="_blank"
                rel="noreferrer"
                onClick={stopLinkClick}
                className="block cursor-pointer rounded-xl bg-black/30 p-4 ring-1 ring-white/8 transition hover:ring-white/18"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ background: handleColor(receipt.handle ?? receipt.url) }}
                  >
                    {initials(receipt.handle ?? "x")}
                  </span>
                  <span className="text-[14px] font-medium text-white">
                    {receipt.handle ? displayHandle(receipt.handle) : "Source"}
                  </span>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-[#c5ccd6]">{receipt.quote}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export function NarrativeGrid({ report }: { report: RadarReport }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const expanded = report.narratives.find((narrative) => narrative.id === expandedId);

  return (
    <div className="relative">
      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        {report.narratives.map((narrative) => (
          <NarrativeCard
            key={narrative.id}
            narrative={narrative}
            dimmed={Boolean(expandedId) && expandedId !== narrative.id}
            onOpen={() => setExpandedId(narrative.id)}
          />
        ))}
      </div>
      {expanded ? (
        <div className="absolute inset-0 z-20">
          <ExpandedNarrative narrative={expanded} onClose={() => setExpandedId(null)} />
        </div>
      ) : null}
    </div>
  );
}
