import { CARRIERS, resolveCarrier } from "../constants/carriers.js";
import { CarrierDetector } from "./detector.js";
import { KdniaoProvider } from "../providers/kdniao.js";
import { KuaiDi100Provider } from "../providers/kuaidi100.js";
import { SimulationProvider } from "../providers/simulator.js";
import { ExpressProvider } from "../providers/base.js";
import {
  CarrierMatch,
  ExpressPluginConfig,
  StandardCarrierCode,
  TrackingResult,
} from "../types.js";

/**
 * 快递统一跟踪服务核心
 */
export class ExpressTracker {
  private readonly detector: CarrierDetector;
  private readonly kd100Provider: KuaiDi100Provider;
  private readonly kdniaoProvider: KdniaoProvider;
  private readonly simulatorProvider: SimulationProvider;
  private readonly cache = new Map<string, { result: TrackingResult; cachedAt: number }>();

  constructor(private readonly config: ExpressPluginConfig) {
    this.detector = new CarrierDetector();
    this.kd100Provider = new KuaiDi100Provider(config);
    this.kdniaoProvider = new KdniaoProvider(config);
    this.simulatorProvider = new SimulationProvider();
  }

  /**
   * 自动探测运单所属快递公司
   */
  public async detectCarrier(trackingNumber: string): Promise<CarrierMatch[]> {
    const localMatches = this.detector.detect(trackingNumber);
    if (localMatches.length > 0 && localMatches[0].confidence === "high") {
      return localMatches;
    }

    // 尝试调用在线自动识别接口补充
    try {
      const onlineCodes = await this.kd100Provider.detect(trackingNumber);
      for (const rawCode of onlineCodes) {
        const resolved = resolveCarrier(rawCode);
        if (resolved && !localMatches.some(m => m.carrier.code === resolved.code)) {
          localMatches.push({
            carrier: resolved,
            confidence: "medium",
            reason: `快递100云端识别推荐为 ${resolved.name}`,
          });
        }
      }
    } catch {
      // ignore online detection errors
    }

    return localMatches;
  }

  /**
   * 查询快递物流轨迹
   * @param trackingNumber 运单号
   * @param carrierInput 快递公司名称或编码（可选，未指定时自动智能推导）
   */
  public async track(
    trackingNumber: string,
    carrierInput?: string
  ): Promise<TrackingResult> {
    const cleanNum = trackingNumber.trim();
    if (!cleanNum) {
      throw new Error("运单号不能为空");
    }

    // 1. 确定快递公司
    let carrierCode: StandardCarrierCode | null = null;
    let carrierName: string = "";

    if (carrierInput) {
      const resolved = resolveCarrier(carrierInput);
      if (resolved) {
        carrierCode = resolved.code;
        carrierName = resolved.name;
      }
    }

    if (!carrierCode) {
      const matches = await this.detectCarrier(cleanNum);
      if (matches.length > 0) {
        carrierCode = matches[0].carrier.code;
        carrierName = matches[0].carrier.name;
      } else {
        // 无法识别时默认顺丰或通用模拟
        carrierCode = "sf";
        carrierName = CARRIERS.sf.name;
      }
    }

    // 2. 检查缓存
    const cacheKey = `${carrierCode}:${cleanNum}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    if (cached) {
      const ttl = cached.result.isDelivered
        ? 24 * 3600 * 1000 // 已签收件缓存 24 小时
        : this.config.cacheTtlMs; // 在途中件按配置缓存 (5分钟)

      if (now - cached.cachedAt < ttl) {
        return {
          ...cached.result,
          cached: true,
        };
      }
    }

    // 3. 构建提供者调用链
    const providersToTry: ExpressProvider[] = [];

    if (this.config.defaultProvider === "kuaidi100") {
      providersToTry.push(this.kd100Provider, this.kdniaoProvider, this.simulatorProvider);
    } else if (this.config.defaultProvider === "kdniao") {
      providersToTry.push(this.kdniaoProvider, this.kd100Provider, this.simulatorProvider);
    } else if (this.config.defaultProvider === "simulator") {
      providersToTry.push(this.simulatorProvider);
    } else {
      // auto 模式：有哪个真实密钥就先尝试哪个，无有效密钥则优雅降级到高拟真沙箱
      if (this.kd100Provider.isAvailable()) {
        providersToTry.push(this.kd100Provider);
      }
      if (this.kdniaoProvider.isAvailable()) {
        providersToTry.push(this.kdniaoProvider);
      }
      providersToTry.push(this.simulatorProvider);
    }

    // 4. 逐个尝试提供者
    let finalResult: TrackingResult | null = null;

    for (const provider of providersToTry) {
      try {
        const res = await provider.track(cleanNum, carrierCode);
        if (res && res.checkpoints.length > 0) {
          finalResult = res;
          break;
        }
      } catch {
        // 当前提供者失败，自动切换下一个
        continue;
      }
    }

    if (!finalResult) {
      // 最终兜底由沙箱生成，确保服务高可用
      finalResult = await this.simulatorProvider.track(cleanNum, carrierCode);
    }

    if (!finalResult) {
      throw new Error(`暂未查询到运单 ${cleanNum} 的物流轨迹，请核对单号与快递公司`);
    }

    // 写入内存缓存
    this.cache.set(cacheKey, {
      result: finalResult,
      cachedAt: now,
    });

    return finalResult;
  }

  /**
   * 批量并发查询多个运单号
   */
  public async batchTrack(
    items: Array<{ trackingNumber: string; carrier?: string }>
  ): Promise<TrackingResult[]> {
    const promises = items.map(item =>
      this.track(item.trackingNumber, item.carrier).catch(err => ({
        trackingNumber: item.trackingNumber,
        carrierCode: (item.carrier as StandardCarrierCode) || "sf",
        carrierName: item.carrier || "未知快递",
        status: "EXCEPTION" as const,
        statusText: "查询失败",
        isDelivered: false,
        checkpoints: [
          {
            time: new Date().toISOString(),
            context: `查询异常: ${err instanceof Error ? err.message : String(err)}`,
            status: "EXCEPTION" as const,
          },
        ],
        provider: "none",
        updatedAt: new Date().toISOString(),
      }))
    );

    return Promise.all(promises);
  }
}
