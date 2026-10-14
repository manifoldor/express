import { TrackingResult } from "../types.js";

/**
 * 物流查询提供者接口
 */
export interface ExpressProvider {
  /**
   * 提供者唯一名称
   */
  readonly name: string;

  /**
   * 当前提供者是否可用（例如是否具备有效 API Key 或网络连通性）
   */
  isAvailable(): boolean;

  /**
   * 查询运单轨迹
   */
  track(trackingNumber: string, carrierCode: string): Promise<TrackingResult | null>;

  /**
   * 在线单号自动识别（可选支持）
   */
  detect?(trackingNumber: string): Promise<string[]>;
}
