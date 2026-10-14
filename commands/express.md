---
name: express
description: 快递运单查询与监控控制命令
argument-hint: "[track|watch|carriers|poll|batch]"
---

执行快递查询与监控清单控制指令。

### 可用子命令：
1. **单号查询 (`/express track <trackingNumber> [carrier]`)**：
   - 查询指定快递单号的最新物流轨迹和派送状态。如果未提供快递公司，将自动识别。
   - 示例：`/express track SF1428571428571`
2. **添加到监控 (`/express watch add <trackingNumber> [tag] [carrier]`)**：
   - 将快递单号加入监控清单，支持附加备注标签。
   - 示例：`/express watch add SF1428571428571 机械键盘`
3. **查看监控清单 (`/express watch list`)**：
   - 列出当前监控中的所有包裹、最新状态与更新时间。
4. **轮询更新 (`/express poll`)**：
   - 检查所有监控包裹是否有新增轨迹节点或状态流转，并输出变更提醒。
5. **移除监控 (`/express watch remove <trackingNumber>`)**：
   - 将指定单号从监控清单中移除。
6. **批量查询 (`/express batch <num1,num2,...>`)**：
   - 逗号分隔同时查询多个单号的当前状态。
7. **支持快递列表 (`/express carriers`)**：
   - 查看系统当前支持的所有中国快递公司、编码及客服热线。
