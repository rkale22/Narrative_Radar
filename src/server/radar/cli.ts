import fs from "node:fs/promises";
import path from "node:path";
import { generateRadarReport } from "./orchestrator";
import { radarRequestSchema } from "@/lib/radar/schema";

type CliArgs = {
  topic: string;
  window: "6h" | "24h" | "7d";
  out: string;
  useSample?: boolean;
};

async function main() {
  await loadDotEnv(path.join(process.cwd(), ".env"));

  const args = parseArgs(process.argv.slice(2));
  const request = radarRequestSchema.parse({
    topic: args.topic,
    window: args.window,
    useSample: args.useSample,
  });

  const report = await generateRadarReport(request);
  const outputPath = path.resolve(args.out);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("radar_cli=ok");
  console.log(`output=${outputPath}`);
  console.log(`topic=${report.topic}`);
  console.log(`narratives=${report.narratives.length}`);
  console.log(`sampledCount=${report.source.sampledCount}`);
}

function parseArgs(argv: string[]): CliArgs {
  const values = new Map<string, string | boolean>();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--sample") {
      values.set("sample", true);
      continue;
    }

    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[index + 1];

      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for --${key}`);
      }

      values.set(key, value);
      index += 1;
    }
  }

  return {
    topic: String(values.get("topic") ?? "Starship Flight 11"),
    window: parseWindow(String(values.get("window") ?? "24h")),
    out: String(values.get("out") ?? "artifacts/radar-report.json"),
    useSample: values.get("sample") === true,
  };
}

function parseWindow(value: string): CliArgs["window"] {
  if (value === "6h" || value === "24h" || value === "7d") {
    return value;
  }

  throw new Error("Window must be one of: 6h, 24h, 7d");
}

async function loadDotEnv(filePath: string) {
  const contents = await fs.readFile(filePath, "utf8").catch(() => "");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed
      .slice(equalsIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

main().catch((error) => {
  console.error("radar_cli=failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
