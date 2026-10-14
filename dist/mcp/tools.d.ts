import { ExpressTracker } from "../core/tracker.js";
import { WatchlistManager } from "../core/watchlist.js";
export interface McpToolDefinition {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: Record<string, unknown>;
        required?: string[];
    };
}
/**
 * 获取 Grokbot Express MCP 工具定义清单
 */
export declare function getMcpToolDefinitions(): McpToolDefinition[];
/**
 * MCP 工具执行器
 */
export declare class McpToolExecutor {
    private readonly tracker;
    private readonly watchlist;
    constructor(tracker: ExpressTracker, watchlist: WatchlistManager);
    executeTool(name: string, args: Record<string, unknown>): Promise<unknown>;
}
