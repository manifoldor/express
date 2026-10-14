import { ExpressPluginConfig, StandardCarrierCode, TrackingResult } from "../types.js";
import { ExpressProvider } from "./base.js";
/**
 * 快递鸟 物流数据提供者
 */
export declare class KdniaoProvider implements ExpressProvider {
    private readonly config;
    readonly name = "kdniao";
    constructor(config: ExpressPluginConfig);
    isAvailable(): boolean;
    track(trackingNumber: string, carrierCode: StandardCarrierCode): Promise<TrackingResult | null>;
}
