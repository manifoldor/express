# Grokbot Express Logistics Plugin (`express`)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![MCP Spec](https://img.shields.io/badge/MCP-2024--11--05-orange.svg)](https://modelcontextprotocol.io/)

基于 **Grokbot / Cursor Plugin 官方规范**打造的中国主流快递包裹查询、智能单号推导与物流监控插件。为智能体（Agent）赋予实时快递追踪、状态机归一化、多单号长期监控以及异常件贴心预警的全套能力。

---

## ✨ 核心特性

- 🚚 **覆盖中国主流快递公司**：原生支持顺丰速运、中通快递、圆通速递、申通快递、韵达快递、极兔速递、中国邮政 EMS、京东物流、德邦快递等。
- 🔍 **单号智能推导 (Auto-Detection)**：支持依据各大快递公司编码规范（前缀特征、号段分布、万国邮联编码等）在毫秒内自动识别快递公司，用户查件无需手动指定快递类型。
- 🚥 **标准化状态机 (Standardized Status Machine)**：多源异构轨迹自动归一化为 7 大标准状态（`PENDING`、`PICKED_UP`、`IN_TRANSIT`、`OUT_FOR_DELIVERY`、`DELIVERED`、`EXCEPTION`、`EXPIRED`）。
- 📞 **快递员与派送网点信息提取**：智能提取派件员姓名、联系电话与网点名称，方便用户一键呼叫催件或修改派送时间。
- 📋 **长期包裹追踪监控清单 (Watchlist)**：支持将单号添加至本地监控清单（可附加备注，如“机械键盘”、“生鲜水果”），支持多单号批量轮询与动态增量变更通知。
- 🔌 **标准 Model Context Protocol (MCP)**：提供标准 JSON-RPC 2.0 stdio MCP 服务，智能体可随时自动调用 8 大高可用物流工具。
- 🛡️ **多源架构与沙箱仿真保障 (High Availability)**：
  - 企业商业通道：支持无缝接入**快递100**、**快递鸟**高并发 API。
  - 内置沙箱仿真器：在开发环境、无外网秘钥或离线测试时自动启用基于中国真实城市物流路由的高拟真仿真引擎，确保体验平滑不中断。

---

## 🏢 支持的快递公司与编码

| 快递公司 | 统一标准代码 | 官方热线 | 快递100代码 | 快递鸟代码 | 典型单号特征 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **顺丰速运** | `sf` | `95338` | `shunfeng` | `SF` | `SF`开头+13~15位，或12/15位纯数字 |
| **京东物流** | `jd` | `950616` | `jd` | `JD` | `JD`、`JDVA`、`JDX` 开头+数字 |
| **中国邮政 EMS** | `ems` | `11183` | `ems` | `EMS` | `EA...CN` 邮联格式或 13 位纯数字 |
| **中通快递** | `zto` | `95311` | `zhongtong` | `ZTO` | 12-14 位数字（常见 `73`, `75`, `78`, `68` 开头） |
| **圆通速递** | `yto` | `95554` | `yuantong` | `YTO` | `YT`开头+13-16位数字，或 `88`, `80` 开头 |
| **申通快递** | `sto` | `95543` | `shentong` | `STO` | 12-15 位数字（常见 `77`, `33`, `55`, `99` 开头） |
| **韵达快递** | `yunda` | `95546` | `yunda` | `YD` | 13-18 位数字（常见 `43`, `31`, `12` 开头） |
| **极兔速递** | `jt` | `956025` | `jitu` | `JT` | `JT` 开头+13-15位数字，或15位数字 |
| **德邦快递** | `deppon` | `95353` | `debangwuliu`| `DBL` | `DPK`、`DPA` 开头或 8-12 位纯数字 |

---

## 📁 目录结构与规范契合

```text
Express/
├── plugin.json                     # Grokbot 插件主清单 (元数据、变量、组件挂载)
├── .cursor-plugin/
│   └── plugin.json                 # Cursor Plugin 标准清单镜像
├── .mcp.json                       # MCP 服务端自启动配置
├── package.json                    # NPM 依赖与构建脚本
├── tsconfig.json                   # TypeScript 配置 (ES2022 + NodeNext)
├── skills/
│   └── express/
│       └── SKILL.md                # 快递查询领域专业知识库与协议指引
├── agents/
│   └── express-agent.md            # 快递助理 Agent 角色设定与工具挂载
├── commands/
│   └── express.md                  # 用户端 /express 斜杠命令说明
├── rules/
│   └── express-rules.md            # 物流轨迹排版、脱敏与异常处置规则
├── hooks/
│   └── hooks.json                  # 会话生命周期 Hook (SessionStart 状态巡检)
├── scripts/
│   └── check-express-status.js     # Hook 触发的快递环境与监控统计脚本
├── src/
│   ├── constants/carriers.ts       # 快递公司权威数据库与识别正则
│   ├── core/
│   │   ├── detector.ts             # 智能单号推导器与状态归一化
│   │   ├── tracker.ts              # 统一物流跟踪核心路由
│   │   └── watchlist.ts            # 本地持久化监控清单与轮询比对
│   ├── providers/
│   │   ├── base.ts                 # 接口抽象
│   │   ├── kuaidi100.ts            # 快递100 Provider
│   │   ├── kdniao.ts               # 快递鸟 Provider
│   │   └── simulator.ts            # 高拟真城市物流沙箱引擎
│   ├── mcp/
│   │   ├── tools.ts                # 8大 MCP 工具定义与执行器
│   │   └── index.ts                # JSON-RPC 2.0 Stdio 服务器
│   └── cli/
│       ├── format.ts               # 终端高亮着色排版
│       └── index.ts                # CLI 命令行入口
└── tests/                          # 自动化单元测试集 (node:test)
```

---

## 🛠️ MCP 工具清单 (Model Context Protocol)

插件向智能体提供 8 个开箱即用的 MCP 标准工具：

1. **`express_track`**
   - 描述：查询指定单号的详细物流轨迹、最新状态、派送员电话与位置。
   - 参数：`tracking_number` (string, 必填), `carrier` (string, 可选)。
2. **`express_detect_carrier`**
   - 描述：分析单号格式，识别所属快递公司并返回置信度与推导原因。
   - 参数：`tracking_number` (string, 必填)。
3. **`express_list_carriers`**
   - 描述：列出所有受支持的快递公司、简码、热线电话及官网。
4. **`express_add_watchlist`**
   - 描述：将运单加入监控关注列表，支持设置自定义标签备注。
   - 参数：`tracking_number` (必填), `tag` (可选), `carrier` (可选)。
5. **`express_get_watchlist`**
   - 描述：获取当前监控中所有包裹的最新轨迹、状态与备注。
6. **`express_remove_watchlist`**
   - 描述：从监控列表中移除指定运单。
   - 参数：`tracking_number` (必填)。
7. **`express_poll_updates`**
   - 描述：检查所有监控包裹是否有新增检查点或状态跳转，生成增量报告。
8. **`express_batch_track`**
   - 描述：批量查询多个单号的当前状态。
   - 参数：`tracking_numbers` (array<string>, 必填)。

---

## 💻 CLI 命令行使用指南

你可以在终端中直接使用 `grokbot-express`：

```bash
# 1. 查询快递 (自动识别快递公司)
npm run start track SF1428571428571

# 2. 指定快递公司查询
npm run start track JD00123456789 jd

# 3. 添加到监控清单 (支持标签备注)
npm run start watch add SF1428571428571 "机械键盘"

# 4. 查看当前监控包裹
npm run start watch list

# 5. 检查监控更新
npm run start poll

# 6. 查看所有支持的快递公司
npm run start carriers

# 7. 启动 MCP 协议服务端
npm run mcp
```

---

## ⚙️ 环境变量与配置

在 `.env` 或运行时环境变量中进行配置（非必填，未配置时自动降级到沙箱模式）：

```bash
# 快递100 (可选)
KUAIDI100_KEY=your_kuaidi100_key
KUAIDI100_CUSTOMER=your_customer_id

# 快递鸟 (可选)
KDNIAO_API_KEY=your_kdniao_api_key
KDNIAO_E_BUSINESS_ID=your_ebusiness_id

# 查询引擎模式: auto (默认) | kuaidi100 | kdniao | simulator
EXPRESS_DEFAULT_PROVIDER=auto

# 监控数据保存目录 (默认: ~/.grokbot/express)
EXPRESS_DATA_DIR=~/.grokbot/express
```

---

## 🧪 自动化测试与构建

```bash
# 编译 TypeScript
npm run build

# 运行全套单元测试
npm test

# 检查类型与测试
npm run check
```

---

## 📄 授权协议

[MIT License](LICENSE) © 2026 Ethan
