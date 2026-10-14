import { getAllCarriers } from "../constants/carriers.js";
/**
 * 获取 Grokbot Express MCP 工具定义清单
 */
export function getMcpToolDefinitions() {
    return [
        {
            name: "express_track",
            description: "查询快递物流轨迹与最新状态。支持顺丰、中通、圆通、申通、韵达、极兔、邮政EMS、京东、德邦等主流快递。若未指定快递公司，系统将自动识别。需要快递100（KUAIDI100_KEY 与 KUAIDI100_CUSTOMER）或快递鸟（KDNIAO_API_KEY 与 KDNIAO_E_BUSINESS_ID）；未配置密钥时返回错误，不会编造轨迹。仅当 EXPRESS_DEMO=1 时返回标注为 demo data 的演示数据。",
            inputSchema: {
                type: "object",
                properties: {
                    tracking_number: {
                        type: "string",
                        description: "快递运单号（必填）",
                    },
                    carrier: {
                        type: "string",
                        description: "快递公司名称或编码（可选，如 sf, zto, yto, 京东, 顺丰 等。不填则自动识别）",
                    },
                },
                required: ["tracking_number"],
            },
        },
        {
            name: "express_detect_carrier",
            description: "根据输入的快递单号，智能识别其可能归属的中国快递公司，并给出置信度与匹配原因。",
            inputSchema: {
                type: "object",
                properties: {
                    tracking_number: {
                        type: "string",
                        description: "快递运单号",
                    },
                },
                required: ["tracking_number"],
            },
        },
        {
            name: "express_list_carriers",
            description: "获取系统当前支持的中国主要快递公司列表、官方客服电话、支持的单号特征与对应编码。",
            inputSchema: {
                type: "object",
                properties: {},
            },
        },
        {
            name: "express_add_watchlist",
            description: "将快递单号添加到长期主动监控清单。支持添加自定义商品备注或标签（如：键盘、退货包裹等）。",
            inputSchema: {
                type: "object",
                properties: {
                    tracking_number: {
                        type: "string",
                        description: "快递运单号",
                    },
                    tag: {
                        type: "string",
                        description: "包裹备注或名称（可选，如：生鲜水果、办公显示器）",
                    },
                    carrier: {
                        type: "string",
                        description: "快递公司名称或编码（可选，不填则自动识别）",
                    },
                },
                required: ["tracking_number"],
            },
        },
        {
            name: "express_get_watchlist",
            description: "查看当前正在监控跟踪的所有包裹清单、最新流转状态、最后更新时间与包裹备注。",
            inputSchema: {
                type: "object",
                properties: {},
            },
        },
        {
            name: "express_remove_watchlist",
            description: "从监控清单中移除指定运单号。",
            inputSchema: {
                type: "object",
                properties: {
                    tracking_number: {
                        type: "string",
                        description: "需要移除的快递运单号",
                    },
                },
                required: ["tracking_number"],
            },
        },
        {
            name: "express_poll_updates",
            description: "主动轮询检查监控清单中所有包裹的最新轨迹，并返回有状态流转或新检查点的包裹变更提醒报告。需要快递100或快递鸟密钥（KUAIDI100_KEY、KUAIDI100_CUSTOMER 或 KDNIAO_API_KEY、KDNIAO_E_BUSINESS_ID）；未配置时返回错误。真实查询失败会返回错误，不会编造轨迹。",
            inputSchema: {
                type: "object",
                properties: {},
            },
        },
        {
            name: "express_batch_track",
            description: "批量一次性查询多个快递单号的最新状态与物流轨迹。需要快递100（KUAIDI100_KEY 与 KUAIDI100_CUSTOMER）或快递鸟（KDNIAO_API_KEY 与 KDNIAO_E_BUSINESS_ID）。未配置密钥或真实查询失败时返回错误，不会编造轨迹。",
            inputSchema: {
                type: "object",
                properties: {
                    tracking_numbers: {
                        type: "array",
                        items: {
                            type: "string",
                        },
                        description: "快递运单号数组",
                    },
                },
                required: ["tracking_numbers"],
            },
        },
    ];
}
/**
 * MCP 工具执行器
 */
export class McpToolExecutor {
    tracker;
    watchlist;
    constructor(tracker, watchlist) {
        this.tracker = tracker;
        this.watchlist = watchlist;
    }
    async executeTool(name, args) {
        switch (name) {
            case "express_track": {
                const trackingNumber = String(args.tracking_number || "").trim();
                const carrier = args.carrier ? String(args.carrier).trim() : undefined;
                return await this.tracker.track(trackingNumber, carrier);
            }
            case "express_detect_carrier": {
                const trackingNumber = String(args.tracking_number || "").trim();
                const matches = await this.tracker.detectCarrier(trackingNumber);
                return {
                    trackingNumber,
                    matches: matches.map(m => ({
                        code: m.carrier.code,
                        name: m.carrier.name,
                        hotline: m.carrier.hotline,
                        confidence: m.confidence,
                        reason: m.reason,
                    })),
                };
            }
            case "express_list_carriers": {
                const carriers = getAllCarriers().map(c => ({
                    code: c.code,
                    name: c.name,
                    shortName: c.shortName,
                    hotline: c.hotline,
                    website: c.website,
                    description: c.description,
                }));
                return {
                    total: carriers.length,
                    carriers,
                };
            }
            case "express_add_watchlist": {
                const trackingNumber = String(args.tracking_number || "").trim();
                const tag = args.tag ? String(args.tag).trim() : undefined;
                const carrier = args.carrier ? String(args.carrier).trim() : undefined;
                const entry = await this.watchlist.add(trackingNumber, tag, carrier, this.tracker);
                return {
                    success: true,
                    message: `运单 ${trackingNumber} 已成功加入监控清单`,
                    entry,
                };
            }
            case "express_get_watchlist": {
                const items = this.watchlist.list();
                return {
                    total: items.length,
                    active: items.filter(i => !i.isDelivered).length,
                    delivered: items.filter(i => i.isDelivered).length,
                    items,
                };
            }
            case "express_remove_watchlist": {
                const trackingNumber = String(args.tracking_number || "").trim();
                const removed = this.watchlist.remove(trackingNumber);
                return {
                    success: removed,
                    message: removed
                        ? `已将运单 ${trackingNumber} 从监控清单中移除`
                        : `监控清单中未找到运单 ${trackingNumber}`,
                };
            }
            case "express_poll_updates": {
                return await this.watchlist.pollUpdates(this.tracker);
            }
            case "express_batch_track": {
                const list = Array.isArray(args.tracking_numbers)
                    ? args.tracking_numbers.map(n => ({ trackingNumber: String(n).trim() }))
                    : [];
                return await this.tracker.batchTrack(list);
            }
            default:
                throw new Error(`未知的工具方法: ${name}`);
        }
    }
}
//# sourceMappingURL=tools.js.map