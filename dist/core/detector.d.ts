import { CarrierMatch, CourierContact, TrackingStatus } from "../types.js";
/**
 * 快递单号智能识别与推导器
 */
export declare class CarrierDetector {
    /**
     * 基于单号特征规则推导匹配的快递公司
     */
    detect(rawTrackingNumber: string): CarrierMatch[];
    /**
     * 从物流描述文本中提取派送员姓名与联系电话
     */
    static extractCourier(text: string): CourierContact;
    /**
     * 将多源不同表述的物流文本标准化映射为系统统一状态
     */
    static normalizeStatus(context: string): TrackingStatus;
    /**
     * 获取状态对应的中文标签
     */
    static getStatusText(status: TrackingStatus): string;
}
