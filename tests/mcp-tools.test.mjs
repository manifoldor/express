import { test } from "node:test";
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { ExpressTracker } from "../dist/core/tracker.js";
import { WatchlistManager } from "../dist/core/watchlist.js";
import { getMcpToolDefinitions, McpToolExecutor } from "../dist/mcp/tools.js";

const TEST_DIR = "./.test-mcp";

test("MCP Tools - definition validation", () => {
  const tools = getMcpToolDefinitions();
  assert.ok(tools.length >= 8);
  const names = tools.map(t => t.name);
  assert.ok(names.includes("express_track"));
  assert.ok(names.includes("express_detect_carrier"));
  assert.ok(names.includes("express_list_carriers"));
  assert.ok(names.includes("express_add_watchlist"));
  assert.ok(names.includes("express_get_watchlist"));
  assert.ok(names.includes("express_remove_watchlist"));
  assert.ok(names.includes("express_poll_updates"));
  assert.ok(names.includes("express_batch_track"));
});

test("MCP ToolExecutor - execute express_track and list_carriers", async () => {
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
  const executor = new McpToolExecutor(tracker, watchlist);

  // 1. express_list_carriers
  const carriersResult = await executor.executeTool("express_list_carriers", {});
  assert.ok(carriersResult.total >= 9);

  // 2. express_detect_carrier
  const detectResult = await executor.executeTool("express_detect_carrier", {
    tracking_number: "JD123456789",
  });
  assert.equal(detectResult.matches[0].code, "jd");

  // 3. express_track
  const trackResult = await executor.executeTool("express_track", {
    tracking_number: "SF1428571428571",
  });
  assert.equal(trackResult.carrierCode, "sf");
  assert.ok(trackResult.checkpoints.length > 0);

  // 4. express_add_watchlist
  const addResult = await executor.executeTool("express_add_watchlist", {
    tracking_number: "SF1428571428571",
    tag: "电子产品",
  });
  assert.equal(addResult.success, true);

  // 5. express_get_watchlist
  const getResult = await executor.executeTool("express_get_watchlist", {});
  assert.equal(getResult.total, 1);

  // 6. express_remove_watchlist
  const removeResult = await executor.executeTool("express_remove_watchlist", {
    tracking_number: "SF1428571428571",
  });
  assert.equal(removeResult.success, true);

  try {
    rmSync(TEST_DIR, { recursive: true, force: true });
  } catch {}
});
