import type { RadarDateRange } from "@/lib/radar/time-window";
import { RadarConfigError, RadarProviderError } from "../errors";

type XSearchToolArgs = {
  topic?: string;
  perspectiveHint?: string;
};

type XaiResponse = {
  output_text?: string;
  citations?: unknown;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

export function createXSearchTools(dateRange: RadarDateRange) {
  return {
    search_x_narratives: {
      description:
        "Search recent X posts for competing narratives about a topic. Use this before drafting the RadarReport.",
      inputSchema: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "The topic, person, event, ticker, or phrase to search on X.",
          },
          perspectiveHint: {
            type: "string",
            description:
              "Optional hint for a narrative or community to investigate more closely.",
          },
        },
        required: ["topic"],
        additionalProperties: false,
      },
      async execute(args: XSearchToolArgs) {
        const topic = args.topic?.trim();
        if (!topic) {
          throw new RadarProviderError("X search tool requires a topic.");
        }

        return JSON.stringify(await searchXNarratives(topic, dateRange, args.perspectiveHint));
      },
    },
  };
}

async function searchXNarratives(
  topic: string,
  dateRange: RadarDateRange,
  perspectiveHint?: string,
) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new RadarConfigError("Missing XAI_API_KEY for x_search.");
  }

  const prompt = [
    `Search X for: ${topic}`,
    `Date window: ${dateRange.fromDate} through ${dateRange.toDate}.`,
    perspectiveHint ? `Investigate this angle too: ${perspectiveHint}` : "",
    "Return evidence only: recurring thesis names, representative handles, short quotes, and source URLs.",
    "Do not write the final product report. The Cursor orchestrator will synthesize it.",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.6",
      input: [{ role: "user", content: prompt }],
      tools: [
        {
          type: "x_search",
          from_date: dateRange.fromDate,
          to_date: dateRange.toDate,
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new RadarProviderError(`xAI x_search failed: ${response.status} ${body}`);
  }

  const body = (await response.json()) as XaiResponse;

  return {
    topic,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate,
    text: extractXaiText(body),
    citations: body.citations ?? [],
  };
}

function extractXaiText(response: XaiResponse): string {
  if (response.output_text) {
    return response.output_text;
  }

  const contentText = response.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter((text): text is string => Boolean(text))
    .join("\n\n");

  if (contentText) {
    return contentText;
  }

  return JSON.stringify(response);
}
