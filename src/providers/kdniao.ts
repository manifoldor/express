import { createHash } from "node:crypto";
import { CARRIERS } from "../constants/carriers.js";
import { CarrierDetector } from "../core/detector.js";
import { ExpressPluginConfig, StandardCarrierCode, TrackingCheckpoint, TrackingResult, TrackingStatus } from "../types.js";
import { ExpressProvider } from "./base.js";

/**
 * 快递鸟 物流数据提供者
 */
export class KdniaoProvider implements ExpressProvider {
  public readonly name = "kdniao";

  constructor(private readonly config: ExpressPluginConfig) {}

  public isAvailable(): boolean {
    return Boolean(this.config.kdniaoApiKey && this.config.kdniaoEBusinessId);
  }

  public async track(
    trackingNumber: string,
    carrierCode: StandardCarrierCode
  ): Promise<TrackingResult | null> {
    if (!this.isAvailable()) return null;

    const carrier = CARRIERS[carrierCode];
    const shipperCode = carrier?.kdniaoCode || carrierCode.toUpperCase();

    const requestData = JSON.stringify({
      OrderCode: "",
      ShipperCode: shipperCode,
      LogisticCode: trackingNumber,
    });

    const apiKey = this.config.kdniaoApiKey!;
    const md5Hex = createHash("md5").update(requestData + apiKey, "utf-8").digest("hex");
    const dataSign = Buffer.from(md5Hex).toString("base64");

    const body = new URLSearchParams({
      RequestData: requestData,
      EBusinessID: this.config.kdniaoEBusinessId!,
      RequestType: "1002",
      DataSign: dataSign,
      DataType: "2",
    }).toString();

    try {
      const res = await fetch("https://api.kdniao.com/Ebusiness/EbusinessOrderHandle.aspx", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
        body,
      });

      if (!res.ok) return null;

      const json = (await res.json()) as {
        Success?: boolean;
        Reason?: string;
        State?: string;
        Traces?: Array<{ AcceptTime: string; AcceptStation: string }>;
      };

      if (!json.Success || !Array.isArray(json.Traces) || json.Traces.length === 0) {
        return null;
      }

      // 快递鸟 Traces 默认是时间正序，我们统一为时间倒序（最新在前）
      const traces = [...json.Traces].reverse();

      const checkpoints: TrackingCheckpoint[] = traces.map(item => {
        const contact = CarrierDetector.extractCourier(item.AcceptStation);
        return {
          time: item.AcceptTime,
          context: item.AcceptStation,
          status: CarrierDetector.normalizeStatus(item.AcceptStation),
          courier: contact.name,
          courierPhone: contact.phone,
        };
      });

      const latest = checkpoints[0];
      const status: TrackingStatus = latest ? latest.status : "IN_TRANSIT";
      const isDelivered = status === "DELIVERED";
      const courier = latest?.courier || latest?.courierPhone ? {
        name: latest.courier,
        phone: latest.courierPhone,
      } : undefined;

      return {
        trackingNumber,
        carrierCode,
        carrierName: carrier?.name || carrierCode,
        status,
        statusText: CarrierDetector.getStatusText(status),
        isDelivered,
        courier,
        latestCheckpoint: latest,
        checkpoints,
        provider: this.name,
        updatedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }
}
