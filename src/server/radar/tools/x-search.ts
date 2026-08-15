import type { RadarDateRange } from "@/lib/radar/time-window";
import type { XPostEvidence } from "@/lib/radar/schema";
import { RadarConfigError, RadarProviderError } from "../errors";

type XSearchToolArgs = {
  topic?: string;
  perspectiveHint?: string;
  maxResults?: number;
};

type ApifyActorItem = {
  id?: unknown;
  tweetId?: unknown;
  url?: unknown;
  tweetUrl?: unknown;
  fullUrl?: unknown;
  twitterUrl?: unknown;
  text?: unknown;
  tweetText?: unknown;
  fullText?: unknown;
  content?: unknown;
  username?: unknown;
  userName?: unknown;
  author?: {
    username?: unknown;
    userName?: unknown;
    name?: unknown;
  };
  user?: {
    username?: unknown;
    userName?: unknown;
    name?: unknown;
  };
  createdAt?: unknown;
  created_at?: unknown;
  likeCount?: unknown;
  likes?: unknown;
  retweetCount?: unknown;
  repostCount?: unknown;
  replyCount?: unknown;
  replies?: unknown;
  viewCount?: unknown;
  views?: unknown;
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
          maxResults: {
            type: "number",
            description: "Maximum normalized posts to return. Defaults to 50.",
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

        return JSON.stringify(
          await searchXNarratives(topic, dateRange, {
            perspectiveHint: args.perspectiveHint,
            maxResults: args.maxResults,
          }),
        );
      },
    },
  };
}

export async function searchXNarratives(
  topic: string,
  dateRange: RadarDateRange,
  options: { perspectiveHint?: string; maxResults?: number } = {},
) {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new RadarConfigError("Missing APIFY_TOKEN for Apify X search.");
  }

  const requestedResults = clampNumber(options.maxResults ?? 50, 1, 100);
  const actorResults = Math.max(requestedResults, 20);
  const actorId = process.env.APIFY_TWITTER_ACTOR ?? "api-ninja/x-twitter-advanced-search";
  const actorPath = actorId.replace("/", "~");
  const query = buildApifyQuery(topic, dateRange, options.perspectiveHint);

  const response = await fetch(
    `https://api.apify.com/v2/acts/${actorPath}/run-sync-get-dataset-items?timeout=120`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        search_type: "Latest",
        numberOfTweets: actorResults,
        scrapeAll: false,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new RadarProviderError(`Apify X search failed: ${response.status} ${body}`);
  }

  const items = (await response.json()) as ApifyActorItem[];
  const posts = items.map(normalizeApifyPost).filter((post): post is XPostEvidence => Boolean(post));

  return {
    provider: "apify",
    actorId,
    query,
    topic,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate,
    rawItemCount: items.length,
    posts: posts.slice(0, requestedResults),
  };
}

function buildApifyQuery(
  topic: string,
  dateRange: RadarDateRange,
  perspectiveHint?: string,
): string {
  return [
    topic,
    perspectiveHint,
    `since:${dateRange.fromDate}`,
    `until:${dateRange.toDate}`,
    "lang:en",
  ]
    .filter(Boolean)
    .join(" ");
}

function normalizeApifyPost(item: ApifyActorItem): XPostEvidence | null {
  const text = firstString(item.text, item.tweetText, item.fullText, item.content);
  if (!text) {
    return null;
  }

  const id = firstString(item.id, item.tweetId) ?? createFallbackId(text);
  const handle = normalizeHandle(
    firstString(item.username, item.userName, item.author?.username, item.author?.userName, item.user?.username, item.user?.userName),
  );

  return {
    id,
    url: firstString(item.url, item.tweetUrl, item.fullUrl, item.twitterUrl),
    text,
    handle,
    authorName: firstString(item.author?.name, item.user?.name),
    createdAt: firstString(item.createdAt, item.created_at),
    likeCount: firstNumber(item.likeCount, item.likes),
    repostCount: firstNumber(item.repostCount, item.retweetCount),
    replyCount: firstNumber(item.replyCount, item.replies),
    viewCount: firstNumber(item.viewCount, item.views),
  };
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number") {
      return String(value);
    }
  }

  return undefined;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replaceAll(",", ""));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function normalizeHandle(handle: string | undefined): string | undefined {
  if (!handle) {
    return undefined;
  }

  return handle.startsWith("@") ? handle : `@${handle}`;
}

function createFallbackId(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.trunc(value), min), max);
}
