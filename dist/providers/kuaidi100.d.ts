import { ExpressPluginConfig, StandardCarrierCode, TrackingResult } from "../types.js";
import { ExpressProvider } from "./base.js";
/**
 * 快递100 物流数据提供者
 */
export declare class KuaiDi100Provider implements ExpressProvider {
    private readonly config;
    readonly name = "kuaidi100";
    constructor(config: ExpressPluginConfig);
    isAvailable(): boolean;
    /**
     * 在线单号自动识别 (自动探测)
     */
    detect(trackingNumber: string): Promise<string[]>;
    /**
     * 查询运单轨迹
     */
    track(trackingNumber: string, carrierCode: StandardCarrierCode): Promise<TrackingResult | null>;
}
