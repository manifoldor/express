#!/usr/bin/env node
import { getAllCarriers } from "../constants/carriers.js";
import { loadConfig } from "../config.js";
import { ExpressTracker } from "../core/tracker.js";
import { WatchlistManager } from "../core/watchlist.js";
import { formatPollReport, formatTrackingResult, formatWatchlist } from "./format.js";
import { startMcpServer } from "../mcp/index.js";
async function main() {
    const args = process.argv.slice(2);
    const command = args[0]?.toLowerCase() || "help";
    const config = loadConfig();
    const tracker = new ExpressTracker(config);
    const watchlist = new WatchlistManager(config);
    switch (command) {
        case "track":
        case "query": {
            const trackingNumber = args[1];
            const carrier = args[2];
            if (!trackingNumber) {
                process.stdout.write("用法: grokbot-express track <运单号> [快递公司]\n");
                process.stdout.write("示例: grokbot-express track SF1428571428571\n");
                process.exit(1);
            }
            process.stdout.write(`🔍 正在查询运单 ${trackingNumber} 的物流轨迹...\n`);
            try {
                const result = await tracker.track(trackingNumber, carrier);
                process.stdout.write(formatTrackingResult(result));
            }
            catch (err) {
                process.stderr.write(`❌ 查询失败: ${err instanceof Error ? err.message : String(err)}\n`);
                process.exit(1);
            }
            break;
        }
        case "watch": {
            const sub = args[1]?.toLowerCase();
            if (sub === "add") {
                const trackingNumber = args[2];
                const tag = args[3];
                const carrier = args[4];
                if (!trackingNumber) {
                    process.stdout.write("用法: grokbot-express watch add <运单号> [备注标签] [快递公司]\n");
                    process.exit(1);
                }
                const entry = await watchlist.add(trackingNumber, tag, carrier, tracker);
                process.stdout.write(`✅ 成功加入监控清单: ${entry.carrierName} ${entry.trackingNumber}${entry.tag ? ` (${entry.tag})` : ""} [当前状态: ${entry.statusText}]\n`);
            }
            else if (sub === "remove" || sub === "rm" || sub === "del") {
                const trackingNumber = args[2];
                if (!trackingNumber) {
                    process.stdout.write("用法: grokbot-express watch remove <运单号>\n");
                    process.exit(1);
                }
                const removed = watchlist.remove(trackingNumber);
                if (removed) {
                    process.stdout.write(`🗑️ 已移除运单 ${trackingNumber}\n`);
                }
                else {
                    process.stdout.write(`⚠️ 监控清单中未找到运单 ${trackingNumber}\n`);
                }
            }
            else {
                // watch list
                const items = watchlist.list();
                process.stdout.write(formatWatchlist(items));
            }
            break;
        }
        case "poll": {
            process.stdout.write("🔄 正在轮询检查监控清单中所有包裹的最新轨迹...\n");
            try {
                const report = await watchlist.pollUpdates(tracker);
                process.stdout.write(formatPollReport(report));
            }
            catch (err) {
                process.stderr.write(`❌ 轮询失败: ${err instanceof Error ? err.message : String(err)}\n`);
                process.exit(1);
            }
            break;
        }
        case "carriers":
        case "list": {
            const carriers = getAllCarriers();
            process.stdout.write("\n🚚 系统支持的中国主流快递公司列表:\n");
            process.stdout.write("─".repeat(50) + "\n");
            carriers.forEach((c, idx) => {
                process.stdout.write(`${idx + 1}. [${c.code.padEnd(6)}] ${c.name.padEnd(16)} (客服电话: ${c.hotline})\n`);
            });
            process.stdout.write("─".repeat(50) + "\n\n");
            break;
        }
        case "mcp": {
            await startMcpServer();
            break;
        }
        case "help":
        default: {
            process.stdout.write(`
📦 Grokbot Express - 中国快递物流查询与追踪命令行工具

用法:
  grokbot-express <命令> [参数...]

可用命令:
  track <运单号> [快递]       查询快递物流轨迹 (自动识别快递公司)
  watch [list]               查看当前监控跟踪的包裹清单
  watch add <单号> [备注]     添加包裹到监控清单并自动跟踪
  watch remove <单号>        从监控清单中移除包裹
  poll                       轮询检查所有监控包裹的最新动态
  carriers                   列出支持的快递公司与官方客服电话
  mcp                        启动 Stdio JSON-RPC 2.0 MCP 协议服务
  help                       显示本帮助信息

示例:
  grokbot-express track SF1428571428571
  grokbot-express track JD00123456789 京东
  grokbot-express watch add SF1428571428571 机械键盘
  grokbot-express poll
\n`);
            break;
        }
    }
}
main().catch(err => {
    process.stderr.write(`Fatal error: ${err}\n`);
    process.exit(1);
});
//# sourceMappingURL=index.js.map