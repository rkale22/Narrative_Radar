import type { RadarReport } from "./schema";

export const sampleRadarReport: RadarReport = {
  topic: "Starship Flight 11",
  window: "24h",
  pulse:
    "X is split on whether this was a successful test or a public failure of the heat shield.",
  narratives: [
    {
      id: "clean-test",
      label: "Clean test, expected loss",
      thesis: "Stage damage was priced in; the flight still proved the profile.",
      sharePct: 38,
      trajectory: "rising",
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
        },
        {
          handle: "@NASASpaceflight",
          quote: "Flight 11 accomplished all primary objectives.",
          url: "https://x.com/NASASpaceflight/status/0000000000000000002",
        },
      ],
    },
    {
      id: "heat-shield",
      label: "Heat shield is the real story",
      thesis: "Catch was fine; tiles and flap damage show the vehicle still is not operational.",
      sharePct: 27,
      trajectory: "stable",
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
        },
        {
          handle: "@MarcusHouse",
          quote: "Flaps cooked, tiles missing. Not operational.",
          url: "https://x.com/MarcusHouse/status/0000000000000000004",
        },
      ],
    },
    {
      id: "pr-win",
      label: "PR win, engineering lag",
      thesis: "Spectacular livestream is covering a slower path to reuse.",
      sharePct: 21,
      trajectory: "rising",
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
        },
        {
          handle: "@zackjames",
          quote: "They're optimizing for hype, not reliability.",
          url: "https://x.com/zackjames/status/0000000000000000006",
        },
      ],
    },
    {
      id: "doomed",
      label: "It's over / doomed program",
      thesis: "Repeated damage means Starship will never be reliable.",
      sharePct: 14,
      trajectory: "fading",
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
        },
        {
          handle: "@SpaceSkeptic",
          quote: "At some point you have to accept reality.",
          url: "https://x.com/SpaceSkeptic/status/0000000000000000008",
        },
      ],
    },
  ],
  collision:
    "The fight is not launch success vs failure. It's whether tile damage is acceptable on the road to reuse.",
  watchFor: ["Close-up tile photos", "FAA mishap language"],
  evidenceThin: false,
  generatedAt: "2026-08-15T17:00:00.000Z",
};
