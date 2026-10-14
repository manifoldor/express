# express — China parcel tracking plugin

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An MCP plugin for Grok Bot (Cursor Agent Plugins format) that tracks parcels from major Chinese couriers: SF Express, ZTO, YTO, STO, Yunda, J&T, China Post EMS, JD Logistics and Deppon.

- Auto-detects the courier from the tracking-number format
- Fetches tracking events through **your own** Kuaidi100 or KDNiao API account and normalizes them into 7 statuses (`PENDING`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `EXCEPTION`, `EXPIRED`)
- Keeps a local watchlist (stored on disk, default `~/.grokbot/express`) and reports new checkpoints when polled

> **Tracking requires your own API key.** `express_track`, `express_batch_track` and `express_poll_updates` call Kuaidi100 or KDNiao and return that provider's data. If neither `KUAIDI100_KEY` + `KUAIDI100_CUSTOMER` nor `KDNIAO_API_KEY` + `KDNIAO_E_BUSINESS_ID` is set, those tools return an error that names the variables. If a real lookup fails, the error is returned as-is. The plugin does not invent tracking events. Carrier detection (`express_detect_carrier`) and `express_list_carriers` stay keyless. Fictional demo events exist only when you set `EXPRESS_DEMO=1`; every demo result has `demo: true`, `provider: "simulator"` and a `demoLabel` that starts with `DEMO DATA`.

## Install

- **Grok Bot plugin marketplace:** search for `express` and install.
- **Manual (MCP):** requires Node.js 20+. The repo includes a built `dist/`, so a clone runs without a compile step:
  ```bash
  git clone https://github.com/manifoldor/express.git && cd express
  node dist/mcp/index.js
  ```
  Register the server from `.mcp.json` (`node dist/mcp/index.js`) in your MCP client, passing the environment variables below. Rebuild from source with `npm ci && npm run build` when you change TypeScript.

## Tools

| Tool | Purpose |
| --- | --- |
| `express_track` | Tracking events for one number (`tracking_number`, optional `carrier`) |
| `express_batch_track` | Status of several numbers (`tracking_numbers`) |
| `express_detect_carrier` | Guess the courier from the number format, with confidence |
| `express_list_carriers` | Supported couriers, codes, hotlines, websites |
| `express_add_watchlist` / `express_get_watchlist` / `express_remove_watchlist` | Manage the local watchlist |
| `express_poll_updates` | Check watched parcels for new checkpoints |

## Data sources and API keys

| Source | Endpoint | Needs credentials |
| --- | --- | --- |
| [Kuaidi100](https://api.kuaidi100.com/) | `poll.kuaidi100.com/poll/query.do` (tracking), `www.kuaidi100.com/autonumber` (courier guess) | Yes for tracking: `KUAIDI100_KEY`, `KUAIDI100_CUSTOMER` |
| [KDNiao](https://www.kdniao.com/) | `api.kdniao.com/Ebusiness/EbusinessOrderHandle.aspx` | Yes: `KDNIAO_API_KEY`, `KDNIAO_E_BUSINESS_ID` |
| Built-in simulator | none (offline) | Opt-in only: `EXPRESS_DEMO=1`. Every result is labeled demo data |

The plugin does not call courier companies' own APIs directly. Set credentials as environment variables (plugin variables in Grok Bot, or a local `.env` copied from `.env.example`). `EXPRESS_DEFAULT_PROVIDER` selects `auto` (default), `kuaidi100`, `kdniao` or `simulator`. `simulator` does nothing unless `EXPRESS_DEMO=1`. In `auto` mode with no keys, `EXPRESS_DEMO=1` is the only way to get demo events; if a configured real provider fails, you get the error, not demo events. Never commit keys; `.env` is git-ignored.

## Disclaimer

Tracking data comes from third-party aggregators and may be delayed, incomplete or wrong; check with the courier for anything important. Courier names are used only to identify carriers. This project is unofficial and not affiliated with any courier, Kuaidi100 or KDNiao.

## License

[MIT](LICENSE) © 2026 Yishan Lin

---

## 中文说明

中国主流快递（顺丰、中通、圆通、申通、韵达、极兔、邮政 EMS、京东、德邦）单号识别、物流轨迹查询和本地包裹监控插件。`express_track`、`express_batch_track`、`express_poll_updates` 查询真实轨迹时必须配置**快递100**（`KUAIDI100_KEY` 与 `KUAIDI100_CUSTOMER`）或**快递鸟**（`KDNIAO_API_KEY` 与 `KDNIAO_E_BUSINESS_ID`）。未配置密钥，或真实接口失败时，返回明确错误，**不会编造轨迹**。单号识别和快递公司列表不需要密钥。虚构演示数据只有在显式设置 `EXPRESS_DEMO=1` 时才会返回，且每条结果都带 `demo: true` 与以 `DEMO DATA` 开头的 `demoLabel`。物流数据来自第三方，可能延迟或不准确。本插件非任何快递公司或接口平台官方产品。仓库已包含编译好的 `dist/`，克隆后可直接用 `node dist/mcp/index.js` 启动。

以下为详细中文文档。

---


## ✨ 核心特性

- 🚚 **覆盖中国主流快递公司**：原生支持顺丰速运、中通快递、圆通速递、申通快递、韵达快递、极兔速递、中国邮政 EMS、京东物流、德邦快递等。
- 🔍 **单号智能推导 (Auto-Detection)**：支持依据各大快递公司编码规范（前缀特征、号段分布、万国邮联编码等）在毫秒内自动识别快递公司，用户查件无需手动指定快递类型。
- 🚥 **标准化状态机 (Standardized Status Machine)**：多源异构轨迹自动归一化为 7 大标准状态（`PENDING`、`PICKED_UP`、`IN_TRANSIT`、`OUT_FOR_DELIVERY`、`DELIVERED`、`EXCEPTION`、`EXPIRED`）。
- 📞 **快递员与派送网点信息提取**：智能提取派件员姓名、联系电话与网点名称，方便用户一键呼叫催件或修改派送时间。
- 📋 **长期包裹追踪监控清单 (Watchlist)**：支持将单号添加至本地监控清单（可附加备注，如“机械键盘”、“生鲜水果”），支持多单号批量轮询与动态增量变更通知。
- 🔌 **标准 Model Context Protocol (MCP)**：提供标准 JSON-RPC 2.0 stdio MCP 服务，智能体可随时自动调用 8 大高可用物流工具。
- 🛡️ **真实查询，失败即报错**：
  - 企业商业通道：接入**快递100**、**快递鸟** API。至少配置其中一组完整密钥后才会发起轨迹查询。
  - 未配置 `KUAIDI100_KEY` + `KUAIDI100_CUSTOMER` 或 `KDNIAO_API_KEY` + `KDNIAO_E_BUSINESS_ID` 时，轨迹查询、批量查询和监控轮询返回错误并写明上述环境变量。
  - 真实接口失败时原样返回错误，不会用模拟轨迹填补。
  - 演示模式：仅当 `EXPRESS_DEMO=1` 时启用内置仿真器，结果标明 `demo: true`、`provider: "simulator"` 和 `DEMO DATA` 标签，不能当作真实物流。

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

在 `.env` 或运行时环境变量中配置。轨迹查询至少需要快递100或快递鸟中的一组完整密钥；未配置时不会自动降级到模拟器。

```bash
# 快递100（轨迹查询需要 KEY 与 CUSTOMER 同时配置）
KUAIDI100_KEY=your_kuaidi100_key
KUAIDI100_CUSTOMER=your_customer_id

# 快递鸟（轨迹查询需要 API_KEY 与 E_BUSINESS_ID 同时配置）
KDNIAO_API_KEY=your_kdniao_api_key
KDNIAO_E_BUSINESS_ID=your_ebusiness_id

# 查询引擎模式: auto (默认) | kuaidi100 | kdniao | simulator
# simulator 只有在 EXPRESS_DEMO=1 时才会返回数据
EXPRESS_DEFAULT_PROVIDER=auto

# 显式开启虚构演示数据。未设置或非 1 时，缺密钥和查询失败都返回错误
EXPRESS_DEMO=1

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

[MIT License](LICENSE) © 2026 Yishan Lin
