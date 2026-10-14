/**
 * 中国主要快递公司权威元数据表
 */
export const CARRIERS = {
    sf: {
        code: "sf",
        name: "顺丰速运",
        shortName: "顺丰",
        pinyin: "shunfeng",
        kuaidi100Code: "shunfeng",
        kdniaoCode: "SF",
        hotline: "95338",
        website: "https://www.sf-express.com",
        description: "中国领先的快递物流综合服务商，时效快、服务优、全网直营。",
        patterns: [
            /^SF\d{13,15}$/i, // 常见 SF 开头+13~15位
            /^SF(?!0000)\d{11,15}$/i,
            /^(1|2|3|6|8)\d{11}$/, // 传统顺丰12位纯数字
            /^(1|2|3|6|8)\d{14}$/, // 传统顺丰15位纯数字
        ],
    },
    zto: {
        code: "zto",
        name: "中通快递",
        shortName: "中通",
        pinyin: "zhongtong",
        kuaidi100Code: "zhongtong",
        kdniaoCode: "ZTO",
        hotline: "95311",
        website: "https://www.zto.com",
        description: "国内业务规模最大的快递物流网络之一，覆盖全国城乡。",
        patterns: [
            /^(73|75|78|68|55|54|53|37|20)\d{10,12}$/, // 常见12-14位数字
            /^ZTO\d{10,14}$/i,
            /^[0-9]{12}$/, // 常用12位纯数字中通
        ],
    },
    yto: {
        code: "yto",
        name: "圆通速递",
        shortName: "圆通",
        pinyin: "yuantong",
        kuaidi100Code: "yuantong",
        kdniaoCode: "YTO",
        hotline: "95554",
        website: "https://www.yto.net.cn",
        description: "大型综合性快递物流运营商，集快递、物流、电商供应链于一体。",
        patterns: [
            /^YT\d{13,16}$/i, // YT开头+13-16位数字
            /^(DD|88|80|20|10|12)\d{10,16}$/i, // 常见号段
            /^[0-9]{10,18}$/, // 常见纯数字运单
        ],
    },
    sto: {
        code: "sto",
        name: "申通快递",
        shortName: "申通",
        pinyin: "shentong",
        kuaidi100Code: "shentong",
        kdniaoCode: "STO",
        hotline: "95543",
        website: "https://www.sto.cn",
        description: "中国传统快递开创者之一，阿里巴巴菜鸟核心物流合作伙伴。",
        patterns: [
            /^STO\d{10,14}$/i,
            /^(77|33|55|44|99|22|88)\d{10,13}$/, // 常见77开头的12-15位数字
            /^[0-9]{12,15}$/,
        ],
    },
    yunda: {
        code: "yunda",
        name: "韵达快递",
        shortName: "韵达",
        pinyin: "yunda",
        kuaidi100Code: "yunda",
        kdniaoCode: "YD",
        hotline: "95546",
        website: "https://www.yundaex.com",
        description: "全国性智慧物流服务商，专注快递主业与末端社区网络。",
        patterns: [
            /^(43|31|12|19|39|46|49)\d{11,16}$/, // 常见43、31开头
            /^[0-9]{13,18}$/,
        ],
    },
    jt: {
        code: "jt",
        name: "极兔速递",
        shortName: "极兔",
        pinyin: "jitu",
        kuaidi100Code: "jitu",
        kdniaoCode: "JT",
        hotline: "956025",
        website: "https://www.jtexpress.com.cn",
        description: "快速崛起的全球综合物流服务运营商，电商件覆盖极广。",
        patterns: [
            /^JT\d{13,15}$/i, // JT开头+13-15位
            /^(jt|JT)[0-9]{12,15}$/,
            /^[0-9]{15}$/, // 15位纯数字
        ],
    },
    ems: {
        code: "ems",
        name: "中国邮政速递物流 (EMS)",
        shortName: "邮政EMS",
        pinyin: "ems",
        kuaidi100Code: "ems",
        kdniaoCode: "EMS",
        hotline: "11183",
        website: "https://www.ems.com.cn",
        description: "国有大型邮政物流企业，网点下沉深度全国第一，覆盖所有乡镇。",
        patterns: [
            /^[E|R|C|A][A-Z]\d{9}CN$/i, // 经典万国邮联标准格式 EA123456789CN
            /^(98|97|99|10|11)\d{11}$/, // 邮政国内标快/快递包裹
            /^[0-9]{13}$/,
        ],
    },
    jd: {
        code: "jd",
        name: "京东快递",
        shortName: "京东",
        pinyin: "jingdong",
        kuaidi100Code: "jd",
        kdniaoCode: "JD",
        hotline: "950616",
        website: "https://www.jdl.com",
        description: "一体化供应链物流服务商，高时效、送货上门与优质逆向物流。",
        patterns: [
            /^JD(VA|VB|VC|VE|VF|X)?\d{9,14}$/i, // JD、JDVA、JDX等开头
            /^JD[0-9]{10,14}$/i,
        ],
    },
    deppon: {
        code: "deppon",
        name: "德邦快递",
        shortName: "德邦",
        pinyin: "debang",
        kuaidi100Code: "debangwuliu",
        kdniaoCode: "DBL",
        hotline: "95353",
        website: "https://www.deppon.com",
        description: "大件快递领导者，主打大件快运与精准汽运卡航。",
        patterns: [
            /^(DPK|DPA|DPB)\d{9,13}$/i,
            /^[1-9]\d{7,11}$/, // 常见8-12位纯数字
        ],
    },
};
/**
 * 快递公司编码别名映射（用户可能输入的中文或拼音缩写）
 */
export const CARRIER_ALIASES = {
    // 顺丰
    顺丰: "sf",
    顺丰速运: "sf",
    顺丰快递: "sf",
    shunfeng: "sf",
    sfexpress: "sf",
    sf: "sf",
    // 中通
    中通: "zto",
    中通快递: "zto",
    zhongtong: "zto",
    zto: "zto",
    // 圆通
    圆通: "yto",
    圆通速递: "yto",
    圆通快递: "yto",
    yuantong: "yto",
    yto: "yto",
    // 申通
    申通: "sto",
    申通快递: "sto",
    shentong: "sto",
    sto: "sto",
    // 韵达
    韵达: "yunda",
    韵达快递: "yunda",
    韵达速递: "yunda",
    yunda: "yunda",
    yd: "yunda",
    // 极兔
    极兔: "jt",
    极兔速递: "jt",
    极兔快递: "jt",
    jitu: "jt",
    jt: "jt",
    jtexpress: "jt",
    // 邮政 / EMS
    邮政: "ems",
    ems: "ems",
    中国邮政: "ems",
    邮政速递: "ems",
    邮政快递: "ems",
    youzheng: "ems",
    post: "ems",
    // 京东
    京东: "jd",
    京东物流: "jd",
    京东快递: "jd",
    jingdong: "jd",
    jd: "jd",
    jdl: "jd",
    // 德邦
    德邦: "deppon",
    德邦快递: "deppon",
    德邦物流: "deppon",
    debang: "deppon",
    deppon: "deppon",
    dbl: "deppon",
};
/**
 * 根据输入检索标准快递公司信息
 */
export function resolveCarrier(input) {
    if (!input)
        return null;
    const key = input.trim().toLowerCase();
    const standardCode = CARRIER_ALIASES[key] || (CARRIERS[key] ? key : null);
    if (standardCode && CARRIERS[standardCode]) {
        return CARRIERS[standardCode];
    }
    return null;
}
/**
 * 获取所有受支持的快递公司列表
 */
export function getAllCarriers() {
    return Object.values(CARRIERS);
}
//# sourceMappingURL=carriers.js.map