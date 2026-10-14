import { TrackingResult, TrackingStatus, WatchlistEntry, WatchlistPollReport } from "../types.js";
export declare function getStatusBadge(status: TrackingStatus, text: string): string;
export declare function formatTrackingResult(res: TrackingResult): string;
export declare function formatWatchlist(items: WatchlistEntry[]): string;
export declare function formatPollReport(report: WatchlistPollReport): string;
