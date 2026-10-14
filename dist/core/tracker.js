import { CARRIERS, resolveCarrier } from "../constants/carriers.js";
import { CarrierDetector } from "./detector.js";
import { KdniaoProvider } from "../providers/kdniao.js";
import { KuaiDi100Provider } from "../providers/kuaidi100.js";
import { SimulationProvider } from "../providers/simulator.js";
/** Shown when tracking is requested without a real provider and without EXPRESS_DEMO=1. */
export const MISSING_TRACKING_CREDENTIALS_MESSAGE = "未配置物流查询密钥，无法查询真实轨迹。请配置快递100环境变量 KUAIDI100_KEY 与 KUAIDI100_CUSTOMER，或快递鸟环境变量 KDNIAO_API_KEY 与 KDNIAO_E_BUSINESS_ID。模拟数据不会自动返回；只有显式设置 EXPRESS_DEMO=1 时才会返回标注为 demo data 的虚构轨迹。";
/**
 * 快递统一跟踪服务核心
 */
export class ExpressTracker {
    config;
    detector;
    kd100Provider;
    kdniaoProvider;
    simulatorProvider;
    cache = new Map();
    constructor(config) {
        this.config = config;
        this.detector = new CarrierDetector();
        this.kd100Provider = new KuaiDi100Provider(config);
        this.kdniaoProvider = new KdniaoProvider(config);
        this.simulatorProvider = new SimulationProvider();
    }
    /**
     * Real providers that can be called for the current engine selection.
     * Simulator is never included here.
     */
    realProviders() {
        const kd100 = this.kd100Provider.isAvailable() ? [this.kd100Provider] : [];
        const kdniao = this.kdniaoProvider.isAvailable() ? [this.kdniaoProvider] : [];
        if (this.config.defaultProvider === "kuaidi100")
            return kd100;
        if (this.config.defaultProvider === "kdniao")
            return kdniao;
        if (this.config.defaultProvider === "simulator")
            return [];
        return [...kd100, ...kdniao];
    }
    /**
     * Demo tracking is opt-in only (EXPRESS_DEMO=1), and never a fallback after a real lookup fails.
     */
    usesDemoProvider() {
        if (this.config.demo !== true)
            return false;
        if (this.config.defaultProvider === "simulator")
            return true;
        return this.config.defaultProvider === "auto" && this.realProviders().length === 0;
    }
    /**
     * Fail closed when neither a real key pair nor explicit demo mode is available.
     */
    ensureTrackingConfigured() {
        if (this.usesDemoProvider())
            return;
        if (this.realProviders().length === 0) {
            throw new Error(MISSING_TRACKING_CREDENTIALS_MESSAGE);
        }
    }
    /**
     * 自动探测运单所属快递公司
     */
    async detectCarrier(trackingNumber) {
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
        }
        catch {
            // ignore online detection errors
        }
        return localMatches;
    }
    /**
     * 查询快递物流轨迹
     * @param trackingNumber 运单号
     * @param carrierInput 快递公司名称或编码（可选，未指定时自动智能推导）
     */
    async track(trackingNumber, carrierInput) {
        const cleanNum = trackingNumber.trim();
        if (!cleanNum) {
            throw new Error("运单号不能为空");
        }
        this.ensureTrackingConfigured();
        // 1. 确定快递公司
        let carrierCode = null;
        let carrierName = "";
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
            }
            else {
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
        // 3. 仅在显式演示模式且没有可用真实密钥时使用模拟器；真实查询失败绝不编造轨迹
        let finalResult = null;
        if (this.usesDemoProvider()) {
            finalResult = await this.simulatorProvider.track(cleanNum, carrierCode);
        }
        else {
            const providersToTry = this.realProviders();
            const errors = [];
            for (const provider of providersToTry) {
                try {
                    const res = await provider.track(cleanNum, carrierCode);
                    if (res && res.checkpoints.length > 0 && res.demo !== true && res.provider !== "simulator") {
                        finalResult = res;
                        break;
                    }
                    errors.push(`${provider.name}: 未返回物流轨迹`);
                }
                catch (err) {
                    errors.push(err instanceof Error ? err.message : String(err));
                }
            }
            if (!finalResult) {
                const detail = errors.length > 0 ? errors.join("；") : "未返回物流轨迹";
                throw new Error(`物流查询失败：${detail}`);
            }
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
    async batchTrack(items) {
        this.ensureTrackingConfigured();
        return Promise.all(items.map(item => this.track(item.trackingNumber, item.carrier)));
    }
}
//# sourceMappingURL=tracker.js.map