import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { resolveCarrier } from "../constants/carriers.js";
/**
 * 快递长期跟踪与主动监控清单管理器
 */
export class WatchlistManager {
    config;
    filePath;
    items = new Map();
    constructor(config) {
        this.config = config;
        if (!existsSync(this.config.dataDir)) {
            mkdirSync(this.config.dataDir, { recursive: true });
        }
        this.filePath = join(this.config.dataDir, "watchlist.json");
        this.load();
    }
    load() {
        if (!existsSync(this.filePath)) {
            this.items = new Map();
            return;
        }
        try {
            const content = readFileSync(this.filePath, "utf-8");
            const data = JSON.parse(content);
            if (Array.isArray(data.items)) {
                this.items = new Map(data.items.map(item => [item.trackingNumber, item]));
            }
        }
        catch {
            this.items = new Map();
        }
    }
    save() {
        const data = {
            version: 1,
            items: Array.from(this.items.values()),
            lastPolledAt: new Date().toISOString(),
        };
        try {
            mkdirSync(dirname(this.filePath), { recursive: true });
            writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
        }
        catch (err) {
            process.stderr.write(`[express:watchlist] Failed to save watchlist: ${String(err)}\n`);
        }
    }
    /**
     * 添加运单到监控清单
     */
    async add(trackingNumber, tag, carrierInput, tracker) {
        const cleanNum = trackingNumber.trim().toUpperCase();
        if (!cleanNum) {
            throw new Error("运单号不能为空");
        }
        let carrierCode = "sf";
        let carrierName = "顺丰速运";
        if (carrierInput) {
            const resolved = resolveCarrier(carrierInput);
            if (resolved) {
                carrierCode = resolved.code;
                carrierName = resolved.name;
            }
        }
        else if (tracker) {
            const matches = await tracker.detectCarrier(cleanNum);
            if (matches.length > 0) {
                carrierCode = matches[0].carrier.code;
                carrierName = matches[0].carrier.name;
            }
        }
        const now = new Date().toISOString();
        const existing = this.items.get(cleanNum);
        const entry = {
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
            }
            catch {
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
    remove(trackingNumber) {
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
    list() {
        return Array.from(this.items.values());
    }
    /**
     * 轮询所有监控包裹并比对状态变更
     */
    async pollUpdates(tracker) {
        tracker.ensureTrackingConfigured();
        const entries = this.list();
        const changes = [];
        let changedCount = 0;
        try {
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
                const latestResult = await tracker.track(entry.trackingNumber, entry.carrierCode);
                const oldStatus = entry.status;
                const newStatus = latestResult.status;
                const oldTime = entry.latestTime;
                const newTime = latestResult.latestCheckpoint?.time;
                const statusChanged = oldStatus !== newStatus;
                const newCheckpoint = Boolean(newTime && newTime !== oldTime);
                const hasChange = statusChanged || newCheckpoint;
                let changeType = "none";
                if (newStatus === "DELIVERED" && oldStatus !== "DELIVERED") {
                    changeType = "delivered";
                }
                else if (statusChanged) {
                    changeType = "status_changed";
                }
                else if (newCheckpoint) {
                    changeType = "new_checkpoint";
                }
                if (hasChange) {
                    changedCount++;
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
            }
        }
        finally {
            if (changedCount > 0) {
                this.save();
            }
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
//# sourceMappingURL=watchlist.js.map