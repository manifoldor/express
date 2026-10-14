import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { ExpressTracker } from "../dist/core/tracker.js";
import { WatchlistManager } from "../dist/core/watchlist.js";

const TEST_DIR = "./.test-watchlist";

test("WatchlistManager - add, list, remove and poll", async () => {
  try {
    rmSync(TEST_DIR, { recursive: true, force: true });
  } catch {}

  const config = {
    defaultProvider: "simulator",
    demo: true,
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

test("WatchlistManager - poll without credentials returns a clear error", async () => {
  const dir = "./.test-watchlist-nokey";
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}

  const tracker = new ExpressTracker({
    defaultProvider: "auto",
    demo: false,
    dataDir: dir,
    cacheTtlMs: 1000,
  });
  const watchlist = new WatchlistManager({
    defaultProvider: "auto",
    demo: false,
    dataDir: dir,
    cacheTtlMs: 1000,
  });

  await assert.rejects(
    () => watchlist.pollUpdates(tracker),
    err => {
      assert.match(err.message, /KUAIDI100_KEY/);
      assert.match(err.message, /KUAIDI100_CUSTOMER/);
      assert.match(err.message, /KDNIAO_API_KEY/);
      assert.match(err.message, /KDNIAO_E_BUSINESS_ID/);
      return true;
    }
  );

  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
});

test("WatchlistManager - save recreates a missing data directory", async () => {
  const dir = "./.test-watchlist-enoent";
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}

  const watchlist = new WatchlistManager({
    defaultProvider: "auto",
    demo: false,
    dataDir: dir,
    cacheTtlMs: 1000,
  });
  rmSync(dir, { recursive: true, force: true });

  const entry = await watchlist.add("SF1428571428571", "目录重建", "顺丰");
  assert.equal(entry.trackingNumber, "SF1428571428571");
  assert.equal(existsSync(join(dir, "watchlist.json")), true);

  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
});
