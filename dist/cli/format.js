const COLORS = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    red: "\x1b[31m",
    magenta: "\x1b[35m",
    bgGreen: "\x1b[42m\x1b[30m",
    bgBlue: "\x1b[44m\x1b[37m",
    bgYellow: "\x1b[43m\x1b[30m",
    bgRed: "\x1b[41m\x1b[37m",
};
export function getStatusBadge(status, text) {
    switch (status) {
        case "DELIVERED":
            return `${COLORS.bgGreen} [已签收] ${COLORS.reset}`;
        case "OUT_FOR_DELIVERY":
            return `${COLORS.bgYellow} [派送中] ${COLORS.reset}`;
        case "IN_TRANSIT":
            return `${COLORS.bgBlue} [运输中] ${COLORS.reset}`;
        case "PICKED_UP":
            return `${COLORS.cyan} [已揽件] ${COLORS.reset}`;
        case "EXCEPTION":
            return `${COLORS.bgRed} [异常件] ${COLORS.reset}`;
        default:
            return `${COLORS.dim} [${text}] ${COLORS.reset}`;
    }
}
export function formatTrackingResult(res) {
    const lines = [];
    const divider = "─".repeat(56);
    lines.push("");
    lines.push(`${COLORS.bold}📦 快递物流轨迹详情${COLORS.reset}`);
    if (res.demo) {
        lines.push(`${COLORS.bgYellow} ${res.demoLabel || "DEMO DATA: fictional tracking events, not a real parcel status."} ${COLORS.reset}`);
    }
    lines.push(divider);
    lines.push(`运单号码: ${COLORS.bold}${res.trackingNumber}${COLORS.reset}`);
    lines.push(`快递公司: ${COLORS.cyan}${res.carrierName} (${res.carrierCode.toUpperCase()})${COLORS.reset}`);
    lines.push(`当前状态: ${getStatusBadge(res.status, res.statusText)}`);
    if (res.origin && res.destination) {
        lines.push(`物流路由: ${res.origin} ──✈️──> ${res.destination}`);
    }
    if (res.courier?.name || res.courier?.phone) {
        lines.push(`派送人员: ${COLORS.green}${res.courier.name || "快递员"}${COLORS.reset} ${res.courier.phone ? `(📞 ${res.courier.phone})` : ""}`);
    }
    lines.push(divider);
    lines.push(`${COLORS.bold}📍 详细物流时间轴 (最新在前):${COLORS.reset}`);
    res.checkpoints.forEach((cp, idx) => {
        const isLatest = idx === 0;
        const bullet = isLatest ? "🟢" : "⚪";
        const timeColor = isLatest ? COLORS.bold + COLORS.green : COLORS.dim;
        lines.push(` ${bullet} ${timeColor}${cp.time}${COLORS.reset}`);
        lines.push(`    ${cp.context}`);
        if (idx < res.checkpoints.length - 1) {
            lines.push(`    │`);
        }
    });
    lines.push(divider);
    lines.push(`${COLORS.dim}数据源: ${res.provider}${res.cached ? " (缓存)" : ""} | 更新时间: ${res.updatedAt.slice(0, 19)}${COLORS.reset}`);
    lines.push("");
    return lines.join("\n");
}
export function formatWatchlist(items) {
    if (items.length === 0) {
        return "\n📭 当前监控清单为空。使用 `express watch add <单号> [备注]` 添加监控包裹。\n";
    }
    const lines = [];
    const divider = "─".repeat(64);
    lines.push("");
    lines.push(`${COLORS.bold}📋 我的快递监控清单 (${items.length} 个包裹)${COLORS.reset}`);
    lines.push(divider);
    items.forEach((item, idx) => {
        const badge = getStatusBadge(item.status, item.statusText);
        const tag = item.tag ? `[🏷️ ${COLORS.bold}${item.tag}${COLORS.reset}] ` : "";
        lines.push(`${idx + 1}. ${tag}${COLORS.cyan}${item.carrierName}${COLORS.reset} ${COLORS.bold}${item.trackingNumber}${COLORS.reset} ${badge}`);
        if (item.latestContext) {
            lines.push(`   最新动态: ${item.latestContext}`);
        }
        if (item.latestTime) {
            lines.push(`   更新时间: ${COLORS.dim}${item.latestTime}${COLORS.reset}`);
        }
        if (idx < items.length - 1) {
            lines.push("");
        }
    });
    lines.push(divider);
    lines.push("");
    return lines.join("\n");
}
export function formatPollReport(report) {
    const lines = [];
    const divider = "─".repeat(60);
    lines.push("");
    lines.push(`${COLORS.bold}🔄 快递监控轮询检查报告${COLORS.reset}`);
    lines.push(divider);
    lines.push(`监控总计: ${report.totalWatched} | 运输派送中: ${report.activeCount} | 已签收: ${report.deliveredCount}`);
    lines.push(`检测到有动态变更的包裹数: ${report.changedCount > 0 ? COLORS.green : ""}${report.changedCount}${COLORS.reset}`);
    lines.push(divider);
    if (report.changedCount === 0) {
        lines.push("所有监控包裹暂无新节点更新。");
    }
    else {
        report.changes
            .filter(c => c.hasChange)
            .forEach(c => {
            const tag = c.entry.tag ? `[${c.entry.tag}] ` : "";
            lines.push(`🔔 ${tag}${c.entry.carrierName} ${COLORS.bold}${c.entry.trackingNumber}${COLORS.reset}:`);
            if (c.changeType === "delivered") {
                lines.push(`   🎉 包裹刚刚已成功【签收】！`);
            }
            else if (c.changeType === "status_changed") {
                lines.push(`   状态跃迁: ${c.oldStatus} ──> ${COLORS.bold}${c.newStatus}${COLORS.reset}`);
            }
            if (c.latestCheckpoint) {
                lines.push(`   最新轨迹: ${c.latestCheckpoint.context}`);
            }
            lines.push("");
        });
    }
    lines.push(divider);
    lines.push("");
    return lines.join("\n");
}
//# sourceMappingURL=format.js.map