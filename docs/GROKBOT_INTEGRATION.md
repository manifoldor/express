# Grokbot 插件体系集成与加载规范

本插件严格按照 Grokbot（Grok Bot / Cursor Plugins 核心体系架构）标准进行构建，全面满足插件市场规范与运行时装载要求。

---

## 1. 插件目录与元数据规范

Grokbot 插件装载器（`PluginComponentDiscovery` 与 `loader.ts`）通过标准文件树与清单索引插件全部功能：

```text
Express/
├── .cursor-plugin/
│   ├── plugin.json         # 核心插件描述清单 (Plugin Manifest)
│   └── marketplace.json    # 插件市场注册清单 (Marketplace Manifest)
├── plugin.json             # 根目录兼容清单 (双路径发现适配)
├── .mcp.json               # Model Context Protocol (MCP) 服务配置
├── skills/                 # 技能定义目录
│   └── express/
│       └── SKILL.md        # YAML Frontmatter + Agent 操作技能指导
├── agents/                 # 智能体定义目录
│   └── express-agent.md    # 专用智能体 (包含 Prompt、模型继承与工具声明)
├── commands/               # 命令扩展目录
│   └── express.md          # 交互命令 /express [track|watch|carriers|poll|batch]
├── rules/                  # 行为规则目录
│   └── express-rules.md    # 物流轨迹格式规范、隐私脱敏与异常处置规则
├── hooks/                  # 生命周期钩子
│   └── hooks.json          # SessionStart 自动化状态探针
├── scripts/                # 钩子与自动化脚本
│   └── check-express-status.js
└── dist/                   # 编译后的执行文件 (MCP Server & CLI)
```

---

## 2. Grokbot 插件装载机理

### 2.1 清单发现与验证
Grokbot 启动时，按以下优先级查找清单文件：
1. `.cursor-plugin/plugin.json`
2. `.claude-plugin/plugin.json`
3. `plugin.json`

清单严格遵循 `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` 规范。插件名称 `express` 匹配 `^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$` Kebab-Case 命名约束。

### 2.2 变量解析与安全隔离
插件清单中声明的 `variables` 会在用户配置后由 Grokbot 的 `mcp-placeholder-variables.ts` 自动进行变量替换：
```json
{
  "command": "node",
  "args": ["dist/mcp/index.js"],
  "env": {
    "KUAIDI100_KEY": "${KUAIDI100_KEY}",
    "KUAIDI100_CUSTOMER": "${KUAIDI100_CUSTOMER}",
    "KDNIAO_API_KEY": "${KDNIAO_API_KEY}",
    "KDNIAO_E_BUSINESS_ID": "${KDNIAO_E_BUSINESS_ID}",
    "EXPRESS_DEFAULT_PROVIDER": "${EXPRESS_DEFAULT_PROVIDER}",
    "EXPRESS_DATA_DIR": "${EXPRESS_DATA_DIR}"
  }
}
```
敏感凭据（如 `KUAIDI100_KEY`、`KDNIAO_API_KEY`）标注 `writeOnly: true`，防止在前端界面或导出日志中泄漏。

### 2.3 组件自动注册
- **Skills**：加载 `skills/express/SKILL.md`，Agent 在遇到物流相关关键词（如 `express`, `kuaidi`, `查快递`, `物流`, `顺丰`, `京东`）时自动激活技能。
- **Agents**：注册 `@express-agent` 专属智能体，具备专门的模型系统提示词以及物流专用 MCP 工具集合。
- **Commands**：注册 `/express` 斜杠命令，支持用户快速查询物流、添加监控清单或查看受支持的快递列表。
- **Rules**：注入 `express-rules.md` 中的格式与展示准则，指导所有 Agent 严格遵守 7 大状态规范并优先时间倒序呈现。
- **Hooks**：在会话启动（`SessionStart`）时调用状态探针，预警监控中的待收包裹数量。
- **MCP Server**：通过 Stdio JSON-RPC 2.0 运行 `dist/mcp/index.js`，向 Grokbot 注册 8 大标准物流操作工具。

---

## 3. 在 Grokbot 中使用此插件

### 3.1 变量配置
在 Grokbot 插件配置中填写（可选，留空则自动启用高拟真沙箱仿真）：
- `KUAIDI100_KEY`: 快递100 授权 API Key
- `KUAIDI100_CUSTOMER`: 快递100 企业商户号
- `KDNIAO_API_KEY`: 快递鸟 API Key
- `KDNIAO_E_BUSINESS_ID`: 快递鸟商户 ID
- `EXPRESS_DEFAULT_PROVIDER`: 引擎模式（`auto`, `kuaidi100`, `kdniao`, `simulator`）

### 3.2 与智能体互动
直接在 Grokbot 聊天框输入：
> “帮我查一下这个快递单号：`SF1428571428571`，并帮我加入监控，标签是‘机械键盘’。”
> 
> 或者键入 `/express track SF1428571428571` 进行极速直查。
