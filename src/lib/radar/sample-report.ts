import type { RadarReport } from "./schema";

export const sampleRadarReport: RadarReport = {
  reportVersion: "1",
  topic: "Starship Flight 11",
  window: "24h",
  generatedAt: "2026-08-15T17:00:00.000Z",
  source: {
    provider: "apify",
    query: "Starship Flight 11 lang:en",
    sampledCount: 847,
  },
  pulse:
    "X is split on whether this was a successful test or a public failure of the heat shield.",
  narratives: [
    {
      id: "clean-test",
      label: "Clean test, expected loss",
      thesis: "Stage damage was priced in; the flight still proved the profile.",
      sharePct: 38,
      trajectory: "rising",
      confidence: "high",
      amplifiers: [
        {
          handle: "@elonmusk",
          why: "Frames the mission as objectives met and lessons learned.",
        },
        {
          handle: "@NASASpaceflight",
          why: "Amplifies the engineering-success interpretation.",
        },
      ],
      receipts: [
        {
          handle: "@elonmusk",
          quote: "Great progress. Lots learned for Flight 12.",
          url: "https://x.com/elonmusk/status/0000000000000000001",
          metrics: {
            replies: 4200,
            reposts: 18000,
            likes: 210000,
            views: 4200000,
          },
        },
        {
          handle: "@NASASpaceflight",
          quote: "Flight 11 accomplished all primary objectives.",
          url: "https://x.com/NASASpaceflight/status/0000000000000000002",
          metrics: {
            replies: 890,
            reposts: 3100,
            likes: 24000,
            views: 980000,
          },
        },
      ],
    },
    {
      id: "heat-shield",
      label: "Heat shield is the real story",
      thesis: "Catch was fine; tiles and flap damage show the vehicle still is not operational.",
      sharePct: 27,
      trajectory: "stable",
      confidence: "high",
      amplifiers: [
        {
          handle: "@SciGuySpace",
          why: "Keeps attention on reentry damage and reuse readiness.",
        },
        {
          handle: "@MarcusHouse",
          why: "Highlights the tile and flap evidence in post-flight analysis.",
        },
      ],
      receipts: [
        {
          handle: "@SciGuySpace",
          quote: "Look at the aft tiles: huge gaps and burn-through.",
          url: "https://x.com/SciGuySpace/status/0000000000000000003",
          metrics: {
            replies: 1100,
            reposts: 4200,
            likes: 19000,
            views: 760000,
          },
        },
        {
          handle: "@MarcusHouse",
          quote: "Flaps cooked, tiles missing. Not operational.",
          url: "https://x.com/MarcusHouse/status/0000000000000000004",
          metrics: {
            replies: 640,
            reposts: 2100,
            likes: 15000,
            views: 510000,
          },
        },
      ],
    },
    {
      id: "pr-win",
      label: "PR win, engineering lag",
      thesis: "Spectacular livestream is covering a slower path to reuse.",
      sharePct: 21,
      trajectory: "rising",
      confidence: "medium",
      amplifiers: [
        {
          handle: "@Erdayastronaut",
          why: "Balances visible progress with a longer reuse timeline.",
        },
        {
          handle: "@zackjames",
          why: "Critiques the hype cycle around partial success.",
        },
      ],
      receipts: [
        {
          handle: "@Erdayastronaut",
          quote: "Great show. Reuse? That's further away.",
          url: "https://x.com/Erdayastronaut/status/0000000000000000005",
          metrics: {
            replies: 720,
            reposts: 1900,
            likes: 12000,
            views: 440000,
          },
        },
        {
          handle: "@zackjames",
          quote: "They're optimizing for hype, not reliability.",
          url: "https://x.com/zackjames/status/0000000000000000006",
          metrics: {
            replies: 310,
            reposts: 980,
            likes: 7400,
            views: 290000,
          },
        },
      ],
    },
    {
      id: "doomed",
      label: "It's over / doomed program",
      thesis: "Repeated damage means Starship will never be reliable.",
      sharePct: 14,
      trajectory: "fading",
      confidence: "low",
      amplifiers: [
        {
          handle: "@ContrarianAlex",
          why: "Pushes the maximal failure framing.",
        },
        {
          handle: "@SpaceSkeptic",
          why: "Treats repeated damage as evidence against the program.",
        },
      ],
      receipts: [
        {
          handle: "@ContrarianAlex",
          quote: "Another explosion, another dream.",
          url: "https://x.com/ContrarianAlex/status/0000000000000000007",
          metrics: {
            replies: 2100,
            reposts: 1600,
            likes: 9800,
            views: 610000,
          },
        },
        {
          handle: "@SpaceSkeptic",
          quote: "At some point you have to accept reality.",
          url: "https://x.com/SpaceSkeptic/status/0000000000000000008",
          metrics: {
            replies: 540,
            reposts: 870,
            likes: 4200,
            views: 180000,
          },
        },
      ],
    },
  ],
  collision: {
    summary:
      "The fight is not launch success vs failure. It's whether tile damage is acceptable on the road to reuse.",
    faultLine: "Operational reuse readiness versus test-flight learning tolerance.",
    narrativeIds: ["clean-test", "heat-shield", "pr-win", "doomed"],
  },
  watchFor: [
    {
      label: "Close-up tile photos",
      why: "Clear imagery could move the debate from vibes to hardware evidence.",
    },
    {
      label: "FAA mishap language",
      why: "Regulatory wording will shape whether damage is treated as expected testing or a failure event.",
    },
  ],
  diagnostics: {
    evidenceThin: false,
    warnings: [],
  },
};
