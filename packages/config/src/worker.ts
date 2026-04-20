import { existsSync } from "node:fs";
import path from "node:path";

export type WorkerEnv = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  FLIGHT_POLL_INTERVAL_MS: number;
  FLIGHT_DATA_SOURCE: "opensky" | "aviationstack";
  OPENSKY_BASE_URL: string;
  OPENSKY_USERNAME?: string;
  OPENSKY_PASSWORD?: string;
  AVIATIONSTACK_BASE_URL: string;
  AVIATIONSTACK_ACCESS_KEY?: string;
};

loadLocalEnvFiles();

export function loadWorkerEnv(): WorkerEnv {
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    FLIGHT_POLL_INTERVAL_MS: Number(process.env.FLIGHT_POLL_INTERVAL_MS ?? "15000"),
    FLIGHT_DATA_SOURCE:
      process.env.FLIGHT_DATA_SOURCE === "aviationstack" ? "aviationstack" : "opensky",
    OPENSKY_BASE_URL: process.env.OPENSKY_BASE_URL ?? "https://opensky-network.org/api",
    OPENSKY_USERNAME: process.env.OPENSKY_USERNAME,
    OPENSKY_PASSWORD: process.env.OPENSKY_PASSWORD,
    AVIATIONSTACK_BASE_URL: process.env.AVIATIONSTACK_BASE_URL ?? "https://api.aviationstack.com/v1",
    AVIATIONSTACK_ACCESS_KEY: process.env.AVIATIONSTACK_ACCESS_KEY,
  };
}

function loadLocalEnvFiles() {
  const cwd = process.cwd();
  const candidatePaths = [
    path.resolve(cwd, ".env"),
    path.resolve(cwd, ".env.local"),
    path.resolve(cwd, "../../.env"),
    path.resolve(cwd, "../../.env.local"),
  ];

  for (const filePath of candidatePaths) {
    if (existsSync(filePath)) {
      process.loadEnvFile(filePath);
    }
  }
}
