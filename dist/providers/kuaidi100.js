import { createHash } from "node:crypto";
import { CARRIERS } from "../constants/carriers.js";
import { CarrierDetector } from "../core/detector.js";
/**
 * 快递100 物流数据提供者
 */
export class KuaiDi100Provider {
    config;
    name = "kuaidi100";
    constructor(config) {
        this.config = config;
    }
    isAvailable() {
        return Boolean(this.config.kuaidi100Key && this.config.kuaidi100Customer);
    }
    /**
     * 在线单号自动识别 (自动探测)
     */
    async detect(trackingNumber) {
        try {
            const url = `https://www.kuaidi100.com/autonumber/autoComNum?resultv2=1&text=${encodeURIComponent(trackingNumber)}`;
            const res = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                },
            });
            if (!res.ok)
                return [];
            const data = (await res.json());
            if (Array.isArray(data.auto)) {
                return data.auto.map(item => item.comCode);
            }
            return [];
        }
        catch {
            return [];
        }
    }
    /**
     * 查询运单轨迹
     */
    async track(trackingNumber, carrierCode) {
        if (!this.isAvailable()) {
            throw new Error("快递100未配置，需要环境变量 KUAIDI100_KEY 与 KUAIDI100_CUSTOMER");
        }
        const carrier = CARRIERS[carrierCode];
        const comCode = carrier?.kuaidi100Code || carrierCode;
        const key = this.config.kuaidi100Key;
        const customer = this.config.kuaidi100Customer;
        const param = JSON.stringify({
            com: comCode,
            num: trackingNumber,
        });
        const md5Str = param + key + customer;
        const sign = createHash("md5").update(md5Str, "utf-8").digest("hex").toUpperCase();
        const body = new URLSearchParams({
            customer,
            sign,
            param,
        }).toString();
        const res = await fetch("https://poll.kuaidi100.com/poll/query.do", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
        });
        if (!res.ok) {
            throw new Error(`快递100 HTTP error ${res.status}`);
        }
        const data = (await res.json());
        if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
            const reason = data.message?.trim() || "未返回物流轨迹";
            throw new Error(`快递100查询失败: ${reason}`);
        }
        const checkpoints = data.data.map(item => {
            const contact = CarrierDetector.extractCourier(item.context);
            return {
                time: item.time || item.ftime || "",
                context: item.context,
                status: CarrierDetector.normalizeStatus(item.context),
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
//# sourceMappingURL=kuaidi100.js.map