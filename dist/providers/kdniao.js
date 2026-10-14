import { createHash } from "node:crypto";
import { CARRIERS } from "../constants/carriers.js";
import { CarrierDetector } from "../core/detector.js";
/**
 * 快递鸟 物流数据提供者
 */
export class KdniaoProvider {
    config;
    name = "kdniao";
    constructor(config) {
        this.config = config;
    }
    isAvailable() {
        return Boolean(this.config.kdniaoApiKey && this.config.kdniaoEBusinessId);
    }
    async track(trackingNumber, carrierCode) {
        if (!this.isAvailable()) {
            throw new Error("快递鸟未配置，需要环境变量 KDNIAO_API_KEY 与 KDNIAO_E_BUSINESS_ID");
        }
        const carrier = CARRIERS[carrierCode];
        const shipperCode = carrier?.kdniaoCode || carrierCode.toUpperCase();
        const requestData = JSON.stringify({
            OrderCode: "",
            ShipperCode: shipperCode,
            LogisticCode: trackingNumber,
        });
        const apiKey = this.config.kdniaoApiKey;
        const md5Hex = createHash("md5").update(requestData + apiKey, "utf-8").digest("hex");
        const dataSign = Buffer.from(md5Hex).toString("base64");
        const body = new URLSearchParams({
            RequestData: requestData,
            EBusinessID: this.config.kdniaoEBusinessId,
            RequestType: "1002",
            DataSign: dataSign,
            DataType: "2",
        }).toString();
        const res = await fetch("https://api.kdniao.com/Ebusiness/EbusinessOrderHandle.aspx", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
            },
            body,
        });
        if (!res.ok) {
            throw new Error(`快递鸟 HTTP error ${res.status}`);
        }
        const json = (await res.json());
        if (!json.Success || !Array.isArray(json.Traces) || json.Traces.length === 0) {
            const reason = json.Reason?.trim() || "未返回物流轨迹";
            throw new Error(`快递鸟查询失败: ${reason}`);
        }
        // 快递鸟 Traces 默认是时间正序，我们统一为时间倒序（最新在前）
        const traces = [...json.Traces].reverse();
        const checkpoints = traces.map(item => {
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
        const status = latest ? latest.status : "IN_TRANSIT";
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
    }
}
//# sourceMappingURL=kdniao.js.map