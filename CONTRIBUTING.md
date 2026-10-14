# Contributing to Grokbot Express Plugin

感谢你对 **Grokbot Express Logistics Plugin** 的关注与支持！我们欢迎所有开发者提交 Issue、提出新功能建议或贡献代码。

---

## 1. 提交指南

1. **Fork 本仓库** 并基于 `main` 分支拉取新的特性分支：
   ```bash
   git checkout -b feat/add-new-carrier
   ```
2. **安装依赖与本地构建**：
   ```bash
   npm install
   npm run build
   ```
3. **编写单元测试**：
   - 增加新的快递公司号段规则时，请同步在 `src/constants/carriers.ts` 和 `tests/detector.test.mjs` 中补充对应的单号样例测试。
4. **运行全量校验**：
   ```bash
   npm run check
   ```
   确保类型检查和 100% 的单元测试通过。
5. **提交 Commit 并发起 Pull Request**：
   - Commit Message 请遵循规范（如：`feat: ...`, `fix: ...`, `docs: ...`）。

---

## 2. 代码与架构准则

- **零重型外部运行时依赖**：核心代码仅使用 Node.js 20+ 原生模块（`node:crypto`, `node:fs`, `node:readline` 等）与标准 Fetch，严禁引入未经充分安全审查的庞大依赖。
- **状态标准化**：任何新对接的第三方平台轨迹文本，都必须通过 `CarrierDetector.normalizeStatus` 统一归一化为标准的 7 种状态之一。
- **隐私合规**：严禁在日志中输出完整的收件人敏感手机号或家庭地址，保留派件员与网点热线电话以便用户催件。

---

## 3. 报告问题与反馈

若发现某个快递公司的号段未被正确识别，或有新快递公司需要接入，请在 GitHub Issues 中提供：
- 快递公司全称与简称
- 脱敏后的示例单号格式（如 `SF1428571*****`）
- 官方查询链接或客服电话
