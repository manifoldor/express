import { CarrierMatch, ExpressPluginConfig, TrackingResult } from "../types.js";
/** Shown when tracking is requested without a real provider and without EXPRESS_DEMO=1. */
export declare const MISSING_TRACKING_CREDENTIALS_MESSAGE = "\u672A\u914D\u7F6E\u7269\u6D41\u67E5\u8BE2\u5BC6\u94A5\uFF0C\u65E0\u6CD5\u67E5\u8BE2\u771F\u5B9E\u8F68\u8FF9\u3002\u8BF7\u914D\u7F6E\u5FEB\u9012100\u73AF\u5883\u53D8\u91CF KUAIDI100_KEY \u4E0E KUAIDI100_CUSTOMER\uFF0C\u6216\u5FEB\u9012\u9E1F\u73AF\u5883\u53D8\u91CF KDNIAO_API_KEY \u4E0E KDNIAO_E_BUSINESS_ID\u3002\u6A21\u62DF\u6570\u636E\u4E0D\u4F1A\u81EA\u52A8\u8FD4\u56DE\uFF1B\u53EA\u6709\u663E\u5F0F\u8BBE\u7F6E EXPRESS_DEMO=1 \u65F6\u624D\u4F1A\u8FD4\u56DE\u6807\u6CE8\u4E3A demo data \u7684\u865A\u6784\u8F68\u8FF9\u3002";
/**
 * 快递统一跟踪服务核心
 */
export declare class ExpressTracker {
    private readonly config;
    private readonly detector;
    private readonly kd100Provider;
    private readonly kdniaoProvider;
    private readonly simulatorProvider;
    private readonly cache;
    constructor(config: ExpressPluginConfig);
    /**
     * Real providers that can be called for the current engine selection.
     * Simulator is never included here.
     */
    private realProviders;
    /**
     * Demo tracking is opt-in only (EXPRESS_DEMO=1), and never a fallback after a real lookup fails.
     */
    private usesDemoProvider;
    /**
     * Fail closed when neither a real key pair nor explicit demo mode is available.
     */
    ensureTrackingConfigured(): void;
    /**
     * 自动探测运单所属快递公司
     */
    detectCarrier(trackingNumber: string): Promise<CarrierMatch[]>;
    /**
     * 查询快递物流轨迹
     * @param trackingNumber 运单号
     * @param carrierInput 快递公司名称或编码（可选，未指定时自动智能推导）
     */
    track(trackingNumber: string, carrierInput?: string): Promise<TrackingResult>;
    /**
     * 批量并发查询多个运单号
     */
    batchTrack(items: Array<{
        trackingNumber: string;
        carrier?: string;
    }>): Promise<TrackingResult[]>;
}
