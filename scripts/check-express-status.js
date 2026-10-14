#!/usr/bin/env node

/**
 * SessionStart hook script for express plugin.
 * Checks express tracking configuration and active parcel watchlist status.
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function checkStatus() {
  const dataDir = process.env.EXPRESS_DATA_DIR || join(homedir(), ".grokbot", "express");
  const watchlistPath = join(dataDir, "watchlist.json");

  const hasKd100 = Boolean(process.env.KUAIDI100_KEY && process.env.KUAIDI100_CUSTOMER);
  const hasKdniao = Boolean(process.env.KDNIAO_API_KEY && process.env.KDNIAO_E_BUSINESS_ID);
  const provider = process.env.EXPRESS_DEFAULT_PROVIDER || "auto";

  let watchCount = 0;
  let deliveringCount = 0;

  if (existsSync(watchlistPath)) {
    try {
      const data = JSON.parse(readFileSync(watchlistPath, "utf-8"));
      if (Array.isArray(data.items)) {
        watchCount = data.items.length;
        deliveringCount = data.items.filter(
          item => item.status === "OUT_FOR_DELIVERY" || item.status === "IN_TRANSIT"
        ).length;
      }
    } catch {
      // ignore parse error
    }
  }

  process.stdout.write(
    `[grokbot-express] Express Plugin Ready (Engine: ${provider}, Watchlist: ${watchCount} parcels, Delivering: ${deliveringCount}, Providers: Kd100=${hasKd100}, Kdniao=${hasKdniao})\n`
  );
}

checkStatus();
