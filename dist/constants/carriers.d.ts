import { CarrierInfo, StandardCarrierCode } from "../types.js";
/**
 * 中国主要快递公司权威元数据表
 */
export declare const CARRIERS: Record<string, CarrierInfo>;
/**
 * 快递公司编码别名映射（用户可能输入的中文或拼音缩写）
 */
export declare const CARRIER_ALIASES: Record<string, StandardCarrierCode>;
/**
 * 根据输入检索标准快递公司信息
 */
export declare function resolveCarrier(input?: string): CarrierInfo | null;
/**
 * 获取所有受支持的快递公司列表
 */
export declare function getAllCarriers(): CarrierInfo[];
