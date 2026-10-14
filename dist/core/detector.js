import { CARRIERS, getAllCarriers } from "../constants/carriers.js";
/**
 * 快递单号智能识别与推导器
 */
export class CarrierDetector {
    /**
     * 基于单号特征规则推导匹配的快递公司
     */
    detect(rawTrackingNumber) {
        const trackingNumber = rawTrackingNumber.trim().toUpperCase();
        if (!trackingNumber)
            return [];
        const matches = [];
        // 1. 特异性强前缀匹配 (HIGH confidence)
        if (trackingNumber.startsWith("SF")) {
            matches.push({
                carrier: CARRIERS.sf,
                confidence: "high",
                reason: "单号以顺丰专属标识 'SF' 开头",
            });
        }
        if (trackingNumber.startsWith("JD") ||
            trackingNumber.startsWith("JDVA") ||
            trackingNumber.startsWith("JDX") ||
            trackingNumber.startsWith("JDVB")) {
            matches.push({
                carrier: CARRIERS.jd,
                confidence: "high",
                reason: "单号以京东物流专属标识 'JD' 开头",
            });
        }
        if ((trackingNumber.startsWith("EA") ||
            trackingNumber.startsWith("RA") ||
            trackingNumber.startsWith("CA") ||
            trackingNumber.startsWith("EM")) &&
            trackingNumber.endsWith("CN")) {
            matches.push({
                carrier: CARRIERS.ems,
                confidence: "high",
                reason: "符合万国邮联 UPU 国际/国内标准 EMS 编码规范",
            });
        }
        if (trackingNumber.startsWith("YT")) {
            matches.push({
                carrier: CARRIERS.yto,
                confidence: "high",
                reason: "单号以圆通速递专属标识 'YT' 开头",
            });
        }
        if (trackingNumber.startsWith("JT")) {
            matches.push({
                carrier: CARRIERS.jt,
                confidence: "high",
                reason: "单号以极兔速递专属标识 'JT' 开头",
            });
        }
        if (trackingNumber.startsWith("DPK") ||
            trackingNumber.startsWith("DPA") ||
            trackingNumber.startsWith("DPB")) {
            matches.push({
                carrier: CARRIERS.deppon,
                confidence: "high",
                reason: "单号以德邦快递专属标识 'DPK' 开头",
            });
        }
        if (trackingNumber.startsWith("STO")) {
            matches.push({
                carrier: CARRIERS.sto,
                confidence: "high",
                reason: "单号以申通快递专属标识 'STO' 开头",
            });
        }
        if (trackingNumber.startsWith("ZTO")) {
            matches.push({
                carrier: CARRIERS.zto,
                confidence: "high",
                reason: "单号以中通快递专属标识 'ZTO' 开头",
            });
        }
        // 2. 经典数字号段特征匹配 (MEDIUM confidence)
        const len = trackingNumber.length;
        const isPureDigits = /^\d+$/.test(trackingNumber);
        if (isPureDigits) {
            // 顺丰纯数字：12 位或 15 位
            if (len === 12 && /^[12368]\d{11}$/.test(trackingNumber)) {
                if (!matches.some(m => m.carrier.code === "sf")) {
                    matches.push({
                        carrier: CARRIERS.sf,
                        confidence: "medium",
                        reason: "符合顺丰速运 12 位经典数字运单特征",
                    });
                }
            }
            // 中通：12-14 位，常见 73, 75, 78, 68, 55 开头
            if ((len === 12 || len === 13 || len === 14) &&
                /^(73|75|78|68|55|54|53|37|20)\d+/.test(trackingNumber)) {
                if (!matches.some(m => m.carrier.code === "zto")) {
                    matches.push({
                        carrier: CARRIERS.zto,
                        confidence: "medium",
                        reason: "符合中通快递典型号段及长度特征",
                    });
                }
            }
            // 申通：12-15 位，常见 77, 33, 55, 44, 99 开头
            if ((len === 12 || len === 13 || len === 15) &&
                /^(77|33|55|44|99|22|88)\d+/.test(trackingNumber)) {
                if (!matches.some(m => m.carrier.code === "sto")) {
                    matches.push({
                        carrier: CARRIERS.sto,
                        confidence: "medium",
                        reason: "符合申通快递典型号段特征",
                    });
                }
            }
            // 韵达：13-18 位，常见 43, 31, 12, 19, 39, 46 开头
            if ((len === 13 || len === 15 || len === 18) &&
                /^(43|31|12|19|39|46|49)\d+/.test(trackingNumber)) {
                if (!matches.some(m => m.carrier.code === "yunda")) {
                    matches.push({
                        carrier: CARRIERS.yunda,
                        confidence: "medium",
                        reason: "符合韵达快递典型号段及长度特征",
                    });
                }
            }
            // 极兔：15 位纯数字
            if (len === 15) {
                if (!matches.some(m => m.carrier.code === "jt")) {
                    matches.push({
                        carrier: CARRIERS.jt,
                        confidence: "medium",
                        reason: "符合极兔 15 位数字运单特征",
                    });
                }
            }
            // 邮政 Domestic：13 位以 98, 97, 99 开头
            if (len === 13 && /^(98|97|99|10|11)\d+/.test(trackingNumber)) {
                if (!matches.some(m => m.carrier.code === "ems")) {
                    matches.push({
                        carrier: CARRIERS.ems,
                        confidence: "medium",
                        reason: "符合中国邮政快递包裹 13 位国内单号特征",
                    });
                }
            }
            // 圆通：10-18 位数字（常以 DD, 88, 80, 20 开头）
            if (/^(88|80|20|10|12)\d+/.test(trackingNumber)) {
                if (!matches.some(m => m.carrier.code === "yto")) {
                    matches.push({
                        carrier: CARRIERS.yto,
                        confidence: "medium",
                        reason: "符合圆通速递数字号段特征",
                    });
                }
            }
        }
        // 3. 通用正则命中兜底 (LOW confidence)
        if (matches.length === 0) {
            for (const carrier of getAllCarriers()) {
                const hit = carrier.patterns.some(p => p.test(trackingNumber));
                if (hit && !matches.some(m => m.carrier.code === carrier.code)) {
                    matches.push({
                        carrier,
                        confidence: "low",
                        reason: `符合 ${carrier.name} 基础长度与字符格式`,
                    });
                }
            }
        }
        // 排序：high > medium > low
        const weight = { high: 3, medium: 2, low: 1 };
        return matches.sort((a, b) => weight[b.confidence] - weight[a.confidence]);
    }
    /**
     * 从物流描述文本中提取派送员姓名与联系电话
     */
    static extractCourier(text) {
        if (!text)
            return {};
        const contact = {};
        // 匹配手机号 (11位数字，以 13-19 开头) 或座机号
        const phoneMatch = text.match(/(?:电话|联系|呼叫|手机|热线|tel|phone)?[:：\s]*((?:1[3-9]\d{9})|(?:\d{3,4}-\d{7,8}))/i);
        if (phoneMatch && phoneMatch[1]) {
            contact.phone = phoneMatch[1];
        }
        // 匹配派件员/快递员姓名
        const nameMatch = text.match(/(?:派件员|快递员|业务员|派送员|司机|师傅)[:：\s]*([^\s,，。；;]{2,4})/);
        if (nameMatch && nameMatch[1]) {
            contact.name = nameMatch[1].trim();
        }
        return contact;
    }
    /**
     * 将多源不同表述的物流文本标准化映射为系统统一状态
     */
    static normalizeStatus(context) {
        const text = context.toLowerCase();
        // 1. 派件中 / 放入快递柜待取
        if (text.includes("派件中") ||
            text.includes("派送中") ||
            text.includes("正在派送") ||
            text.includes("正在派件") ||
            text.includes("安排派送") ||
            text.includes("待派送") ||
            text.includes("投递中") ||
            text.includes("已放入快递柜") ||
            text.includes("已到达丰巢") ||
            text.includes("丰巢快递柜") ||
            text.includes("菜鸟驿站") ||
            text.includes("已暂存") ||
            text.includes("等待自提") ||
            text.includes("凭码取件")) {
            return "OUT_FOR_DELIVERY";
        }
        // 2. 已签收
        if (text.includes("已签收") ||
            text.includes("签收人") ||
            text.includes("代收点已代签") ||
            text.includes("客户签收") ||
            text.includes("妥投") ||
            text.includes("已投递") ||
            text.includes("已取件") ||
            text.includes("快件已被签收") ||
            text.includes("正常签收")) {
            return "DELIVERED";
        }
        // 3. 异常件
        if (text.includes("异常") ||
            text.includes("拒收") ||
            text.includes("退回") ||
            text.includes("滞留") ||
            text.includes("破损") ||
            text.includes("无法联系") ||
            text.includes("地址不详") ||
            text.includes("电话无人接听") ||
            text.includes("延误") ||
            text.includes("改约") ||
            text.includes("客户取消")) {
            return "EXCEPTION";
        }
        // 4. 运输中
        if (text.includes("运输中") ||
            text.includes("转运") ||
            text.includes("发往") ||
            text.includes("到达") ||
            text.includes("下一站") ||
            text.includes("离开") ||
            text.includes("分拨中心") ||
            text.includes("集散中心") ||
            text.includes("分拣") ||
            text.includes("干线") ||
            text.includes("航空")) {
            return "IN_TRANSIT";
        }
        // 5. 已揽收
        if (text.includes("揽收") ||
            text.includes("已收件") ||
            text.includes("已取件") ||
            text.includes("揽投员") ||
            text.includes("成功揽件") ||
            text.includes("已由网点收取") ||
            text.includes("已由营业网点")) {
            return "PICKED_UP";
        }
        // 6. 待揽收 / 已下单
        if (text.includes("已下单") ||
            text.includes("电子面单已生成") ||
            text.includes("待揽收") ||
            text.includes("等待揽件") ||
            text.includes("已通知快递员")) {
            return "PENDING";
        }
        return "IN_TRANSIT";
    }
    /**
     * 获取状态对应的中文标签
     */
    static getStatusText(status) {
        switch (status) {
            case "PENDING":
                return "待揽收";
            case "PICKED_UP":
                return "已揽收";
            case "IN_TRANSIT":
                return "运输中";
            case "OUT_FOR_DELIVERY":
                return "派件中";
            case "DELIVERED":
                return "已签收";
            case "EXCEPTION":
                return "异常件";
            case "EXPIRED":
                return "超期未更新";
            default:
                return "查询中";
        }
    }
}
//# sourceMappingURL=detector.js.map