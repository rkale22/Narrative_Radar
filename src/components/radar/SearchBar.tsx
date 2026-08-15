"use client";

import type { FormEvent } from "react";
import { SearchIcon, WINDOWS, timeAgo } from "@/components/radar/icons";
import type { RadarWindow } from "@/lib/radar";

type SearchBarProps = {
  topic: string;
  window: RadarWindow;
  generatedAt?: string;
  loading: boolean;
  onTopicChange: (value: string) => void;
  onWindowChange: (value: RadarWindow) => void;
  onSubmit: () => void;
};

export function SearchBar({
  topic,
  window,
  generatedAt,
  loading,
  onTopicChange,
  onWindowChange,
  onSubmit,
}: SearchBarProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
      <label className="relative min-w-[280px] flex-1">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b93a0]" />
        <input
          value={topic}
          onChange={(event) => onTopicChange(event.target.value)}
          placeholder="Search a topic, person, or ticker"
          className="h-12 w-full rounded-full bg-[#10151c] pl-11 pr-4 text-[15px] text-white outline-none ring-1 ring-white/10 placeholder:text-[#6f7886] focus:ring-[#3ee0d6]/50"
        />
      </label>
      <div className="flex rounded-full bg-[#10151c] p-1 ring-1 ring-white/10">
        {WINDOWS.map((id) => {
          const selected = id === window;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onWindowChange(id)}
              className={`h-10 min-w-14 cursor-pointer rounded-full px-4 text-[13px] font-medium transition ${
                selected
                  ? "bg-[#3ee0d6] text-[#06201d]"
                  : "text-[#9aa3b0] hover:text-white"
              }`}
            >
              {id}
            </button>
          );
        })}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="h-12 cursor-pointer rounded-full bg-white/8 px-5 text-[13px] font-medium text-white ring-1 ring-white/10 hover:bg-white/12 disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? "Scanning…" : "Scan"}
      </button>
      <div className="ml-auto text-[12px] text-[#8b93a0]">Updated {timeAgo(generatedAt)}</div>
    </form>
  );
}
