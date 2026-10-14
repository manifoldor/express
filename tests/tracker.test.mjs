import { test } from "node:test";
import assert from "node:assert/strict";
import { ExpressTracker } from "../dist/core/tracker.js";

test("ExpressTracker - track with auto carrier detection", async () => {
  const tracker = new ExpressTracker({
    defaultProvider: "simulator",
    dataDir: "./test-data",
    cacheTtlMs: 1000,
  });

  const result = await tracker.track("SF1428571428571");
  assert.equal(result.trackingNumber, "SF1428571428571");
  assert.equal(result.carrierCode, "sf");
  assert.ok(result.checkpoints.length > 0);
  assert.ok(["PENDING", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(result.status));
});

test("ExpressTracker - track with explicit carrier alias", async () => {
  const tracker = new ExpressTracker({
    defaultProvider: "simulator",
    dataDir: "./test-data",
    cacheTtlMs: 1000,
  });

  const result = await tracker.track("1234567890", "京东");
  assert.equal(result.carrierCode, "jd");
  assert.equal(result.carrierName, "京东快递");
});

test("ExpressTracker - batch track multiple parcels", async () => {
  const tracker = new ExpressTracker({
    defaultProvider: "simulator",
    dataDir: "./test-data",
    cacheTtlMs: 1000,
  });

  const results = await tracker.batchTrack([
    { trackingNumber: "SF1000000000001" },
    { trackingNumber: "JD2000000000002" },
  ]);

  assert.equal(results.length, 2);
  assert.equal(results[0].carrierCode, "sf");
  assert.equal(results[1].carrierCode, "jd");
});
