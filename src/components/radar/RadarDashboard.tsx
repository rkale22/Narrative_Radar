"use client";

import { useRef, useState } from "react";
import { FooterInsights } from "@/components/radar/FooterInsights";
import { Header } from "@/components/radar/Header";
import { NarrativeGrid } from "@/components/radar/NarrativeCard";
import { PulseBanner } from "@/components/radar/PulseBanner";
import { SearchBar } from "@/components/radar/SearchBar";
import { sampleRadarReport, type RadarReport, type RadarResponse, type RadarWindow } from "@/lib/radar";

export function RadarDashboard() {
  const [topic, setTopic] = useState(sampleRadarReport.topic);
  const [window, setWindow] = useState<RadarWindow>(sampleRadarReport.window);
  const [report, setReport] = useState<RadarReport>(sampleRadarReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  async function handleSubmit() {
    const nextTopic = topic.trim();
    if (nextTopic.length < 2 || inFlightRef.current) return;

    inFlightRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: nextTopic, window }),
      });
      const data = (await response.json()) as RadarResponse;

      if (!data.ok) {
        setError(data.error.message);
        setReport({
          ...sampleRadarReport,
          topic: nextTopic,
          window,
          generatedAt: new Date().toISOString(),
        });
        return;
      }

      setReport(data.report);
    } catch {
      setError("Could not reach Narrative Radar.");
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1280px] px-6 py-6">
      <Header />
      <div className="mt-6">
        <SearchBar
          topic={topic}
          window={window}
          generatedAt={report.generatedAt}
          loading={loading}
          onTopicChange={setTopic}
          onWindowChange={setWindow}
          onSubmit={handleSubmit}
        />
      </div>
      {error ? (
        <div className="mt-4 rounded-xl bg-[#e25b4a]/10 px-4 py-3 text-[13px] text-[#f3c0ba] ring-1 ring-[#e25b4a]/25">
          {error} Showing sample narratives so the dashboard stays demoable.
        </div>
      ) : null}
      {loading ? (
        <div className="mt-4 rounded-xl bg-[#3ee0d6]/8 px-4 py-3 text-[13px] text-[#b7f3ee] ring-1 ring-[#3ee0d6]/20">
          Searching X…
        </div>
      ) : null}
      <div className="mt-5">
        <PulseBanner report={report} />
      </div>
      <div className="mt-4">
        <NarrativeGrid report={report} />
      </div>
      <div className="mt-4">
        <FooterInsights report={report} />
      </div>
    </main>
  );
}
