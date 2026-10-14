import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveCarrier } from "../constants/carriers.js";
import {
  ExpressPluginConfig,
  StandardCarrierCode,
  WatchlistChange,
  WatchlistEntry,
  WatchlistPollReport,
} from "../types.js";
import { ExpressTracker } from "./tracker.js";

interface WatchlistStorageData {
  version: number;
  items: WatchlistEntry[];
  lastPolledAt?: string;
}

/**
 * 快递长期跟踪与主动监控清单管理器
 */
export class WatchlistManager {
  private readonly filePath: string;
  private items: Map<string, WatchlistEntry> = new Map();

  constructor(private readonly config: ExpressPluginConfig) {
    if (!existsSync(this.config.dataDir)) {
      mkdirSync(this.config.dataDir, { recursive: true });
    }
    this.filePath = join(this.config.dataDir, "watchlist.json");
    this.load();
  }

  private load(): void {
    if (!existsSync(this.filePath)) {
      this.items = new Map();
      return;
    }

    try {
      const content = readFileSync(this.filePath, "utf-8");
      const data = JSON.parse(content) as WatchlistStorageData;
      if (Array.isArray(data.items)) {
        this.items = new Map(data.items.map(item => [item.trackingNumber, item]));
      }
    } catch {
      this.items = new Map();
    }
  }

  private save(): void {
    const data: WatchlistStorageData = {
      version: 1,
      items: Array.from(this.items.values()),
      lastPolledAt: new Date().toISOString(),
    };
    try {
      writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      process.stderr.write(`[express:watchlist] Failed to save watchlist: ${String(err)}\n`);
    }
  }

  /**
   * 添加运单到监控清单
   */
  public async add(
    trackingNumber: string,
    tag?: string,
    carrierInput?: string,
    tracker?: ExpressTracker
  ): Promise<WatchlistEntry> {
    const cleanNum = trackingNumber.trim().toUpperCase();
    if (!cleanNum) {
      throw new Error("运单号不能为空");
    }

    let carrierCode: StandardCarrierCode = "sf";
    let carrierName = "顺丰速运";

    if (carrierInput) {
      const resolved = resolveCarrier(carrierInput);
      if (resolved) {
        carrierCode = resolved.code;
        carrierName = resolved.name;
      }
    } else if (tracker) {
      const matches = await tracker.detectCarrier(cleanNum);
      if (matches.length > 0) {
        carrierCode = matches[0].carrier.code;
        carrierName = matches[0].carrier.name;
      }
    }

    const now = new Date().toISOString();
    const existing = this.items.get(cleanNum);

    const entry: WatchlistEntry = {
      trackingNumber: cleanNum,
      carrierCode: existing?.carrierCode || carrierCode,
      carrierName: existing?.carrierName || carrierName,
      tag: tag || existing?.tag,
      addedAt: existing?.addedAt || now,
      updatedAt: now,
      status: existing?.status || "PENDING",
      statusText: existing?.statusText || "待查询",
      isDelivered: existing?.isDelivered || false,
      latestContext: existing?.latestContext,
      latestTime: existing?.latestTime,
    };

    // 如果传入了 tracker，立即查一次最新轨迹填充
    if (tracker) {
      try {
        const result = await tracker.track(cleanNum, carrierCode);
        entry.carrierCode = result.carrierCode;
        entry.carrierName = result.carrierName;
        entry.status = result.status;
        entry.statusText = result.statusText;
        entry.isDelivered = result.isDelivered;
        entry.latestContext = result.latestCheckpoint?.context;
        entry.latestTime = result.latestCheckpoint?.time;
      } catch {
        // 首次查询容错
      }
    }

    this.items.set(cleanNum, entry);
    this.save();
    return entry;
  }

  /**
   * 移除监控
   */
  public remove(trackingNumber: string): boolean {
    const cleanNum = trackingNumber.trim().toUpperCase();
    const removed = this.items.delete(cleanNum);
    if (removed) {
      this.save();
    }
    return removed;
  }

  /**
   * 获取当前监控清单
   */
  public list(): WatchlistEntry[] {
    return Array.from(this.items.values());
  }

  /**
   * 轮询所有监控包裹并比对状态变更
   */
  public async pollUpdates(tracker: ExpressTracker): Promise<WatchlistPollReport> {
    const entries = this.list();
    const changes: WatchlistChange[] = [];
    let changedCount = 0;

    for (const entry of entries) {
      // 已签收超过7天的不再频繁轮询
      if (entry.isDelivered) {
        changes.push({
          entry,
          hasChange: false,
          changeType: "none",
        });
        continue;
      }

      try {
        const latestResult = await tracker.track(entry.trackingNumber, entry.carrierCode);
        const oldStatus = entry.status;
        const newStatus = latestResult.status;
        const oldTime = entry.latestTime;
        const newTime = latestResult.latestCheckpoint?.time;

        const statusChanged = oldStatus !== newStatus;
        const newCheckpoint = Boolean(newTime && newTime !== oldTime);
        const hasChange = statusChanged || newCheckpoint;

        let changeType: WatchlistChange["changeType"] = "none";
        if (newStatus === "DELIVERED" && oldStatus !== "DELIVERED") {
          changeType = "delivered";
        } else if (statusChanged) {
          changeType = "status_changed";
        } else if (newCheckpoint) {
          changeType = "new_checkpoint";
        }

        if (hasChange) {
          changedCount++;
          // 更新 entry
          entry.status = newStatus;
          entry.statusText = latestResult.statusText;
          entry.isDelivered = latestResult.isDelivered;
          entry.latestContext = latestResult.latestCheckpoint?.context;
          entry.latestTime = newTime;
          entry.updatedAt = new Date().toISOString();
          this.items.set(entry.trackingNumber, entry);
        }

        changes.push({
          entry,
          hasChange,
          changeType,
          oldStatus,
          newStatus,
          latestCheckpoint: latestResult.latestCheckpoint,
        });
      } catch {
        changes.push({
          entry,
          hasChange: false,
          changeType: "none",
        });
      }
    }

    if (changedCount > 0) {
      this.save();
    }

    return {
      timestamp: new Date().toISOString(),
      totalWatched: entries.length,
      activeCount: entries.filter(e => !e.isDelivered).length,
      deliveredCount: entries.filter(e => e.isDelivered).length,
      changedCount,
      changes,
    };
  }
}
