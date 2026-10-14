/**
 * Express Tracking & Logistics Type Definitions
 */
export type StandardCarrierCode = "sf" | "zto" | "yto" | "sto" | "yunda" | "jt" | "ems" | "jd" | "deppon" | (string & {});
export type TrackingStatus = "PENDING" | "PICKED_UP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "EXCEPTION" | "EXPIRED";
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
    /** True only for explicit EXPRESS_DEMO=1 simulator results. */
    demo?: boolean;
    /** Human-readable label present on every demo result. */
    demoLabel?: string;
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
    /** Explicit opt-in for fictional demo tracking. Set only when EXPRESS_DEMO=1. */
    demo: boolean;
    dataDir: string;
    cacheTtlMs: number;
}
