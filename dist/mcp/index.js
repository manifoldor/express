#!/usr/bin/env node
import * as readline from "node:readline";
import { loadConfig } from "../config.js";
import { ExpressTracker } from "../core/tracker.js";
import { WatchlistManager } from "../core/watchlist.js";
import { getMcpToolDefinitions, McpToolExecutor } from "./tools.js";
/**
 * Model Context Protocol (MCP) Server for Express Parcel Tracking.
 * Communicates via JSON-RPC 2.0 over Stdio (standard input/output).
 */
async function startMcpServer() {
    const config = loadConfig();
    const tracker = new ExpressTracker(config);
    const watchlist = new WatchlistManager(config);
    const toolExecutor = new McpToolExecutor(tracker, watchlist);
    const toolDefinitions = getMcpToolDefinitions();
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    });
    const sendResponse = (response) => {
        process.stdout.write(JSON.stringify(response) + "\n");
    };
    rl.on("line", async (line) => {
        const trimmed = line.trim();
        if (!trimmed)
            return;
        let request;
        try {
            request = JSON.parse(trimmed);
        }
        catch {
            sendResponse({
                jsonrpc: "2.0",
                id: null,
                error: { code: -32700, message: "Parse error" },
            });
            return;
        }
        const { id, method, params } = request;
        // 处理通知类消息（无 id）
        if (id === undefined || id === null) {
            if (method === "notifications/initialized") {
                return;
            }
        }
        try {
            switch (method) {
                case "initialize": {
                    sendResponse({
                        jsonrpc: "2.0",
                        id,
                        result: {
                            protocolVersion: "2024-11-05",
                            serverInfo: {
                                name: "express-mcp",
                                version: "1.0.0",
                            },
                            capabilities: {
                                tools: {},
                            },
                        },
                    });
                    break;
                }
                case "ping": {
                    sendResponse({
                        jsonrpc: "2.0",
                        id,
                        result: {},
                    });
                    break;
                }
                case "tools/list": {
                    sendResponse({
                        jsonrpc: "2.0",
                        id,
                        result: {
                            tools: toolDefinitions,
                        },
                    });
                    break;
                }
                case "tools/call": {
                    const toolName = params?.name;
                    const toolArgs = params?.arguments || {};
                    try {
                        const output = await toolExecutor.executeTool(toolName, toolArgs);
                        sendResponse({
                            jsonrpc: "2.0",
                            id,
                            result: {
                                content: [
                                    {
                                        type: "text",
                                        text: typeof output === "string" ? output : JSON.stringify(output, null, 2),
                                    },
                                ],
                                isError: false,
                            },
                        });
                    }
                    catch (toolError) {
                        sendResponse({
                            jsonrpc: "2.0",
                            id,
                            result: {
                                content: [
                                    {
                                        type: "text",
                                        text: `Tool execution error: ${toolError instanceof Error ? toolError.message : String(toolError)}`,
                                    },
                                ],
                                isError: true,
                            },
                        });
                    }
                    break;
                }
                default: {
                    sendResponse({
                        jsonrpc: "2.0",
                        id,
                        error: {
                            code: -32601,
                            message: `Method not found: ${method}`,
                        },
                    });
                    break;
                }
            }
        }
        catch (err) {
            sendResponse({
                jsonrpc: "2.0",
                id,
                error: {
                    code: -32603,
                    message: `Internal server error: ${err instanceof Error ? err.message : String(err)}`,
                },
            });
        }
    });
    process.stderr.write("[express-mcp] Express Tracking MCP Server ready for JSON-RPC connections.\n");
}
import { fileURLToPath } from "node:url";
const isMainModule = () => {
    if (!process.argv[1])
        return false;
    try {
        const mainPath = fileURLToPath(import.meta.url);
        return process.argv[1] === mainPath || process.argv[1].endsWith("/mcp/index.js") || process.argv[1].endsWith("express-mcp");
    }
    catch {
        return false;
    }
};
if (isMainModule()) {
    startMcpServer().catch(err => {
        process.stderr.write(`[express-mcp] Fatal error: ${err}\n`);
        process.exit(1);
    });
}
export { startMcpServer };
//# sourceMappingURL=index.js.map