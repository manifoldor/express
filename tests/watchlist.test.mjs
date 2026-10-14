import { test } from "node:test";
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { ExpressTracker } from "../dist/core/tracker.js";
import { WatchlistManager } from "../dist/core/watchlist.js";

const TEST_DIR = "./.test-watchlist";

test("WatchlistManager - add, list, remove and poll", async () => {
  try {
    rmSync(TEST_DIR, { recursive: true, force: true });
  } catch {}

  const config = {
    defaultProvider: "simulator",
    dataDir: TEST_DIR,
    cacheTtlMs: 1000,
  };

  const tracker = new ExpressTracker(config);
  const watchlist = new WatchlistManager(config);

  // Add to watch
  const entry = await watchlist.add("SF1428571428571", "测试商品", "顺丰", tracker);
  assert.equal(entry.trackingNumber, "SF1428571428571");
  assert.equal(entry.tag, "测试商品");
  assert.equal(entry.carrierCode, "sf");

  // List
  const items = watchlist.list();
  assert.equal(items.length, 1);
  assert.equal(items[0].trackingNumber, "SF1428571428571");

  // Poll
  const pollReport = await watchlist.pollUpdates(tracker);
  assert.equal(pollReport.totalWatched, 1);

  // Remove
  const removed = watchlist.remove("SF1428571428571");
  assert.equal(removed, true);
  assert.equal(watchlist.list().length, 0);

  try {
    rmSync(TEST_DIR, { recursive: true, force: true });
  } catch {}
});
