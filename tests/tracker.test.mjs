import { test } from "node:test";
import assert from "node:assert/strict";
import { ExpressTracker, MISSING_TRACKING_CREDENTIALS_MESSAGE } from "../dist/core/tracker.js";

const demoConfig = {
  defaultProvider: "simulator",
  demo: true,
  dataDir: "./test-data",
  cacheTtlMs: 1000,
};

function assertNamesCredentials(error) {
  const message = error instanceof Error ? error.message : String(error);
  assert.match(message, /KUAIDI100_KEY/);
  assert.match(message, /KUAIDI100_CUSTOMER/);
  assert.match(message, /KDNIAO_API_KEY/);
  assert.match(message, /KDNIAO_E_BUSINESS_ID/);
  assert.match(message, /EXPRESS_DEMO=1/);
  return true;
}

test("ExpressTracker - track with auto carrier detection", async () => {
  const tracker = new ExpressTracker(demoConfig);

  const result = await tracker.track("SF1428571428571");
  assert.equal(result.trackingNumber, "SF1428571428571");
  assert.equal(result.carrierCode, "sf");
  assert.equal(result.provider, "simulator");
  assert.equal(result.demo, true);
  assert.match(result.demoLabel, /DEMO DATA/);
  assert.match(result.statusText, /DEMO DATA/);
  assert.ok(result.checkpoints.length > 0);
  assert.ok(result.checkpoints.every(cp => cp.context.startsWith("[DEMO]")));
  assert.ok(["PENDING", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(result.status));
});

test("ExpressTracker - track with explicit carrier alias", async () => {
  const tracker = new ExpressTracker(demoConfig);

  const result = await tracker.track("1234567890", "京东");
  assert.equal(result.carrierCode, "jd");
  assert.equal(result.carrierName, "京东快递");
  assert.equal(result.demo, true);
  assert.match(result.demoLabel, /DEMO DATA/);
});

test("ExpressTracker - batch track multiple parcels", async () => {
  const tracker = new ExpressTracker(demoConfig);

  const results = await tracker.batchTrack([
    { trackingNumber: "SF1000000000001" },
    { trackingNumber: "JD2000000000002" },
  ]);

  assert.equal(results.length, 2);
  assert.equal(results[0].carrierCode, "sf");
  assert.equal(results[1].carrierCode, "jd");
  assert.ok(results.every(result => result.demo === true && /DEMO DATA/.test(result.demoLabel)));
});

test("ExpressTracker - missing credentials returns a clear error", async () => {
  const tracker = new ExpressTracker({
    defaultProvider: "auto",
    demo: false,
    dataDir: "./test-data",
    cacheTtlMs: 1000,
  });

  await assert.rejects(() => tracker.track("SF1428571428571"), assertNamesCredentials);
  await assert.rejects(
    () => tracker.batchTrack([{ trackingNumber: "SF1428571428571" }]),
    assertNamesCredentials
  );
  await assert.rejects(
    () => tracker.track("SF1428571428571"),
    err => {
      assert.equal(err.message, MISSING_TRACKING_CREDENTIALS_MESSAGE);
      return true;
    }
  );
});

test("ExpressTracker - simulator without EXPRESS_DEMO is rejected", async () => {
  const tracker = new ExpressTracker({
    defaultProvider: "simulator",
    demo: false,
    dataDir: "./test-data",
    cacheTtlMs: 1000,
  });

  await assert.rejects(() => tracker.track("SF1428571428571"), assertNamesCredentials);
});

test("ExpressTracker - EXPRESS_DEMO=1 without keys is labeled demo data", async () => {
  const tracker = new ExpressTracker({
    defaultProvider: "auto",
    demo: true,
    dataDir: "./test-data",
    cacheTtlMs: 1000,
  });

  const result = await tracker.track("SF1428571428571");
  assert.equal(result.provider, "simulator");
  assert.equal(result.demo, true);
  assert.match(result.demoLabel, /DEMO DATA/);
  assert.match(result.demoLabel, /EXPRESS_DEMO=1/);
});

test("ExpressTracker - real lookup failure is returned and never simulated", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("network down");
  };

  try {
    const tracker = new ExpressTracker({
      defaultProvider: "kuaidi100",
      demo: true,
      kuaidi100Key: "test-key",
      kuaidi100Customer: "test-customer",
      dataDir: "./test-data",
      cacheTtlMs: 1000,
    });

    await assert.rejects(
      () => tracker.track("SF1428571428571"),
      err => {
        assert.match(err.message, /network down/);
        assert.doesNotMatch(err.message, /DEMO DATA/);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("ExpressTracker - carrier detection stays keyless", async () => {
  const tracker = new ExpressTracker({
    defaultProvider: "auto",
    demo: false,
    dataDir: "./test-data",
    cacheTtlMs: 1000,
  });

  const matches = await tracker.detectCarrier("JD123456789");
  assert.equal(matches[0].carrier.code, "jd");
});
