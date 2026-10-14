import { createHash } from "node:crypto";
import { CARRIERS } from "../constants/carriers.js";
import { CarrierDetector } from "../core/detector.js";
const SAMPLE_ROUTES = [
    {
        origin: "广东省深圳市",
        originHub: "深圳宝安转运中心",
        destination: "北京市",
        destHub: "北京顺义航空分拨中心",
        destBranch: "北京海淀中关村营业部",
    },
    {
        origin: "浙江省杭州市",
        originHub: "杭州萧山分拨集散中心",
        destination: "上海市",
        destHub: "上海青浦运转中心",
        destBranch: "上海浦东张江高科网点",
    },
    {
        origin: "广东省广州市",
        originHub: "广州白云航空集散中心",
        destination: "四川省成都市",
        destHub: "成都双流运转中心",
        destBranch: "成都高新区天府软件园网点",
    },
    {
        origin: "江苏省苏州市",
        originHub: "苏州相城转运中心",
        destination: "湖北省武汉市",
        destHub: "武汉东西湖枢纽分拨中心",
        destBranch: "武汉武昌光谷营业部",
    },
    {
        origin: "陕西省西安市",
        originHub: "西安咸阳分拣中心",
        destination: "广东省深圳市",
        destHub: "深圳龙华转运中心",
        destBranch: "深圳南山科技园营业部",
    },
];
const COURIER_NAMES = ["张强", "李伟", "王建国", "刘洋", "赵亮", "陈杰", "杨洋", "孙晓华"];
/** Present on every simulator result so callers cannot mistake it for live tracking. */
export const DEMO_DATA_LABEL = "DEMO DATA: fictional tracking events for demonstration only. Not a real parcel status. Enabled only because EXPRESS_DEMO=1.";
/**
 * 内置快递物流沙箱仿真引擎 (Simulator)
 * 仅在调用方显式设置 EXPRESS_DEMO=1 时使用。每条结果都标注为 demo data，不能当作真实物流。
 */
export class SimulationProvider {
    name = "simulator";
    isAvailable() {
        return false;
    }
    async track(trackingNumber, carrierCode) {
        const carrier = CARRIERS[carrierCode] || {
            code: carrierCode,
            name: `${carrierCode.toUpperCase()}快递`,
            hotline: "95555",
        };
        // 使用单号哈希生成确定性的种子，保证同一单号多次查询轨迹一致但随时间合理推进
        const hashHex = createHash("md5").update(trackingNumber).digest("hex");
        const seed = parseInt(hashHex.slice(0, 8), 16);
        const routeIndex = seed % SAMPLE_ROUTES.length;
        const route = SAMPLE_ROUTES[routeIndex];
        const courierIndex = seed % COURIER_NAMES.length;
        const courierName = COURIER_NAMES[courierIndex];
        const courierPhone = `13${80 + (seed % 19)}${String(seed % 10000000).padStart(7, "0")}`;
        // 确定单号当前达到的阶段 (0:揽件, 1:起运枢纽, 2:干线在途, 3:目的分拨, 4:派送中, 5:已签收)
        const stage = seed % 6;
        const now = Date.now();
        const checkpoints = [];
        // 格式化时间辅助函数
        const formatTime = (ts) => {
            const d = new Date(ts);
            const YYYY = d.getFullYear();
            const MM = String(d.getMonth() + 1).padStart(2, "0");
            const DD = String(d.getDate()).padStart(2, "0");
            const hh = String(d.getHours()).padStart(2, "0");
            const mm = String(d.getMinutes()).padStart(2, "0");
            const ss = String(d.getSeconds()).padStart(2, "0");
            return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
        };
        // 时间节点倒推（小时）
        const hours = [0.8, 3.5, 9.2, 18.5, 26.0, 31.5];
        // 节点 0: 揽件
        const t0 = now - hours[stage] * 3600 * 1000;
        const cp0 = {
            time: formatTime(t0),
            context: `[DEMO] 【${route.origin}】快件已由【${route.origin}揽收网点】揽收，揽收员：${courierName} (电话：${courierPhone})`,
            status: "PICKED_UP",
            location: route.origin,
            courier: courierName,
            courierPhone,
        };
        // 节点 1: 到达始发地枢纽
        const t1 = t0 + 2.5 * 3600 * 1000;
        const cp1 = {
            time: formatTime(t1),
            context: `[DEMO] 【${route.origin}】快件已到达【${route.originHub}】，准备发往【${route.destination}】`,
            status: "IN_TRANSIT",
            location: route.origin,
        };
        // 节点 2: 干线转运中
        const t2 = t1 + 5.5 * 3600 * 1000;
        const cp2 = {
            time: formatTime(t2),
            context: `[DEMO] 【${route.originHub}】快件已装车发往【${route.destHub}】，干线集装箱运输中`,
            status: "IN_TRANSIT",
            location: route.origin,
        };
        // 节点 3: 到达目的地分拨
        const t3 = t2 + 9.0 * 3600 * 1000;
        const cp3 = {
            time: formatTime(t3),
            context: `[DEMO] 【${route.destination}】快件已到达【${route.destHub}】，正在进行分拣`,
            status: "IN_TRANSIT",
            location: route.destination,
        };
        // 节点 4: 派件中
        const t4 = t3 + 7.5 * 3600 * 1000;
        const cp4 = {
            time: formatTime(t4),
            context: `[DEMO] 【${route.destination}】快件已到达【${route.destBranch}】，派件员：${courierName} (电话：${courierPhone}) 正在为您派件中，请保持电话通畅`,
            status: "OUT_FOR_DELIVERY",
            location: route.destination,
            courier: courierName,
            courierPhone,
        };
        // 节点 5: 已签收
        const t5 = t4 + 2.0 * 3600 * 1000;
        const signWays = ["本人凭取件码签收", "客户已签收", "丰巢快递柜代收", "小区物业前台代签收"];
        const signWay = signWays[seed % signWays.length];
        const cp5 = {
            time: formatTime(t5),
            context: `[DEMO] 【${route.destination}】快件已由【${signWay}】，感谢使用${carrier.name}，期待再次为您服务！如有疑问请拨打服务热线：${carrier.hotline}`,
            status: "DELIVERED",
            location: route.destination,
            courier: courierName,
            courierPhone,
        };
        const allSteps = [cp0, cp1, cp2, cp3, cp4, cp5];
        const actualSteps = allSteps.slice(0, stage + 1);
        // 按照系统规范，最新节点在数组最前（时间倒序）
        const reversed = [...actualSteps].reverse();
        const latest = reversed[0];
        const status = latest ? latest.status : "PENDING";
        return {
            trackingNumber,
            carrierCode,
            carrierName: carrier.name,
            status,
            statusText: `DEMO DATA · ${CarrierDetector.getStatusText(status)}`,
            isDelivered: status === "DELIVERED",
            origin: route.origin,
            destination: route.destination,
            courier: {
                name: latest?.courier,
                phone: latest?.courierPhone,
            },
            latestCheckpoint: latest,
            checkpoints: reversed,
            provider: "simulator",
            demo: true,
            demoLabel: DEMO_DATA_LABEL,
            updatedAt: new Date().toISOString(),
        };
    }
}
//# sourceMappingURL=simulator.js.map