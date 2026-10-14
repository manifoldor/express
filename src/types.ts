/**
 * Express Tracking & Logistics Type Definitions
 */

export type StandardCarrierCode =
  | "sf"       // 顺丰速运
  | "zto"      // 中通快递
  | "yto"      // 圆通速递
  | "sto"      // 申通快递
  | "yunda"    // 韵达快递
  | "jt"       // 极兔速递
  | "ems"      // 中国邮政/EMS
  | "jd"       // 京东快递
  | "deppon"   // 德邦快递
  | (string & {});

export type TrackingStatus =
  | "PENDING"           // 待揽收 / 已下单
  | "PICKED_UP"         // 已揽收
  | "IN_TRANSIT"        // 运输中 / 转运中
  | "OUT_FOR_DELIVERY"  // 派件中
  | "DELIVERED"         // 已签收
  | "EXCEPTION"         // 异常件 (拒收、退件、滞留等)
  | "EXPIRED";          // 超期未更新

export interface CarrierInfo {
  code: StandardCarrierCode;
  name: string;
  shortName: string;
  pinyin: string;
  kuaidi100Code: string;
  kdniaoCode: string;
  hotline: string;
  website: string;
  description: string;
  patterns: RegExp[];
}

export interface CarrierMatch {
  carrier: CarrierInfo;
  confidence: "high" | "medium" | "low";
  reason: string;
}

export interface TrackingCheckpoint {
  time: string;
  context: string;
  status: TrackingStatus;
  location?: string;
  courier?: string;
  courierPhone?: string;
}

export interface CourierContact {
  name?: string;
  phone?: string;
}

export interface TrackingResult {
  trackingNumber: string;
  carrierCode: StandardCarrierCode;
  carrierName: string;
  status: TrackingStatus;
  statusText: string;
  isDelivered: boolean;
  courier?: CourierContact;
  latestCheckpoint?: TrackingCheckpoint;
  checkpoints: TrackingCheckpoint[];
  origin?: string;
  destination?: string;
  estimatedDelivery?: string;
  provider: string;
  updatedAt: string;
  cached?: boolean;
}

export interface WatchlistEntry {
  trackingNumber: string;
  carrierCode: StandardCarrierCode;
  carrierName: string;
  tag?: string;
  addedAt: string;
  updatedAt: string;
  status: TrackingStatus;
  statusText: string;
  isDelivered: boolean;
  latestContext?: string;
  latestTime?: string;
}

export interface WatchlistChange {
  entry: WatchlistEntry;
  hasChange: boolean;
  changeType?: "status_changed" | "new_checkpoint" | "delivered" | "none";
  oldStatus?: TrackingStatus;
  newStatus?: TrackingStatus;
  latestCheckpoint?: TrackingCheckpoint;
}

export interface WatchlistPollReport {
  timestamp: string;
  totalWatched: number;
  activeCount: number;
  deliveredCount: number;
  changedCount: number;
  changes: WatchlistChange[];
}

export interface ExpressPluginConfig {
  kuaidi100Key?: string;
  kuaidi100Customer?: string;
  kdniaoApiKey?: string;
  kdniaoEBusinessId?: string;
  defaultProvider: "auto" | "kuaidi100" | "kdniao" | "simulator";
  dataDir: string;
  cacheTtlMs: number;
}
