import { homedir } from "node:os";
import { join } from "node:path";
import { ExpressPluginConfig } from "./types.js";

/**
 * 加载并验证插件运行时配置
 */
export function loadConfig(): ExpressPluginConfig {
  const defaultDataDir = join(homedir(), ".grokbot", "express");

  const rawProvider = (process.env.EXPRESS_DEFAULT_PROVIDER || "auto").toLowerCase();
  const validProviders = ["auto", "kuaidi100", "kdniao", "simulator"];
  const defaultProvider = (validProviders.includes(rawProvider) ? rawProvider : "auto") as
    | "auto"
    | "kuaidi100"
    | "kdniao"
    | "simulator";

  return {
    kuaidi100Key: process.env.KUAIDI100_KEY?.trim() || undefined,
    kuaidi100Customer: process.env.KUAIDI100_CUSTOMER?.trim() || undefined,
    kdniaoApiKey: process.env.KDNIAO_API_KEY?.trim() || undefined,
    kdniaoEBusinessId: process.env.KDNIAO_E_BUSINESS_ID?.trim() || undefined,
    defaultProvider,
    dataDir: process.env.EXPRESS_DATA_DIR?.trim() || defaultDataDir,
    cacheTtlMs: 5 * 60 * 1000, // 5 分钟轨迹缓存
  };
}
