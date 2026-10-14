import { ExpressPluginConfig, WatchlistEntry, WatchlistPollReport } from "../types.js";
import { ExpressTracker } from "./tracker.js";
/**
 * 快递长期跟踪与主动监控清单管理器
 */
export declare class WatchlistManager {
    private readonly config;
    private readonly filePath;
    private items;
    constructor(config: ExpressPluginConfig);
    private load;
    private save;
    /**
     * 添加运单到监控清单
     */
    add(trackingNumber: string, tag?: string, carrierInput?: string, tracker?: ExpressTracker): Promise<WatchlistEntry>;
    /**
     * 移除监控
     */
    remove(trackingNumber: string): boolean;
    /**
     * 获取当前监控清单
     */
    list(): WatchlistEntry[];
    /**
     * 轮询所有监控包裹并比对状态变更
     */
    pollUpdates(tracker: ExpressTracker): Promise<WatchlistPollReport>;
}
