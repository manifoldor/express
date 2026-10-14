# Changelog

All notable changes to the **grokbot-plugin-express** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-14

### Initial Release 🎉

#### Added
- **Courier Support**: Comprehensive support for major Chinese couriers:
  - SF Express (顺丰速运, `sf`)
  - JD Logistics (京东物流, `jd`)
  - China Post EMS (中国邮政速递物流, `ems`)
  - ZTO Express (中通快递, `zto`)
  - YTO Express (圆通速递, `yto`)
  - STO Express (申通快递, `sto`)
  - Yunda Express (韵达快递, `yunda`)
  - J&T Express (极兔速递, `jt`)
  - Deppon Express (德邦快递, `deppon`)
- **Carrier Auto-Detection**: Rule-based & heuristic regex pattern recognition with confidence scoring (`high`, `medium`, `low`).
- **Standardized Status Machine**: 7 standard states (`PENDING`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `EXCEPTION`, `EXPIRED`).
- **Courier & Station Extraction**: Automatic extraction of courier name, contact telephone, and local station branches.
- **Multi-Provider Architecture**:
  - `KuaiDi100Provider`: Enterprise signature poll query & autoComNum detection.
  - `KdniaoProvider`: EBusiness order query interface with MD5/Base64 DataSign.
  - `SimulationProvider`: Built-in sandbox routing engine based on realistic Chinese inter-city freight routes.
- **Watchlist & Polling**: Persistent local storage (`watchlist.json`) with change detection (`status_changed`, `new_checkpoint`, `delivered`).
- **MCP Server**: Stdio JSON-RPC 2.0 server with 8 tools (`express_track`, `express_detect_carrier`, `express_list_carriers`, `express_add_watchlist`, `express_get_watchlist`, `express_remove_watchlist`, `express_poll_updates`, `express_batch_track`).
- **Grokbot / Cursor Plugin Compliance**: Complete manifests (`plugin.json`, `marketplace.json`, `.mcp.json`, `skills/`, `agents/`, `commands/`, `rules/`, `hooks/`).
- **CLI Suite**: Terminal CLI (`grokbot-express`) with ANSI status badges, timeline formatting, and route arrows.
- **Unit Tests**: Full test suite built on native Node.js test runner (`node:test`).
