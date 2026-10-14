import { StandardCarrierCode, TrackingResult } from "../types.js";
import { ExpressProvider } from "./base.js";
/** Present on every simulator result so callers cannot mistake it for live tracking. */
export declare const DEMO_DATA_LABEL = "DEMO DATA: fictional tracking events for demonstration only. Not a real parcel status. Enabled only because EXPRESS_DEMO=1.";
/**
 * 内置快递物流沙箱仿真引擎 (Simulator)
 * 仅在调用方显式设置 EXPRESS_DEMO=1 时使用。每条结果都标注为 demo data，不能当作真实物流。
 */
export declare class SimulationProvider implements ExpressProvider {
    readonly name = "simulator";
    isAvailable(): boolean;
    track(trackingNumber: string, carrierCode: StandardCarrierCode): Promise<TrackingResult | null>;
}
