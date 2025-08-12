# Weekly Report Generator

一个用于将CSV格式的任务数据转换为周报模板的CLI工具。

## 功能特性

- 读取CSV格式的任务数据
- 自动计算工作量（基于开始和结束日期）
- 格式化日期显示
- 生成标准的周报Markdown表格
- 支持中文列名和输出

## 安装

```bash
# 在项目根目录执行
pnpm install
```

## 使用方法

### 开发模式运行

```bash
# 直接运行TypeScript文件
pnpm dev example-tasks.csv
```

### 构建后运行

```bash
# 构建项目
pnpm build

# 运行构建后的文件
node dist/index.js example-tasks.csv
```

## CSV文件格式

CSV文件应该包含以下列（使用制表符分隔）：

| 列名 | 说明 | 示例 |
|------|------|------|
| 属性 | 是否包含在周报中 | Yes/No |
| Task Name | 任务名称 | AI项目富文本编辑器调研 |
| Start Date | 开始日期 | 08/04/2025 |
| End Date | 结束日期 | 08/04/2025 |
| Priority | 优先级 | High/Medium/Low |
| Status | 状态 | Done/In Progress |
| Tag | 标签 | |
| Person In Charge | 负责人 | Phil Liu |
| Parent item | 父任务 | |
| Sub-item | 子任务 | |

## 输出格式

工具会生成以下格式的Markdown表格：

```markdown
| 事項                     | 負責人 | 工作量 | 開始時間  | 結束時間  | 狀態   |
| ------------------------ | ------ | ------ | --------- | --------- | ------ |
| AI项目富文本编辑器调研   | Phil Liu | 1      | 2025/08/04 | 2025/08/04 | 已完成 |
| 编辑器初始化配置，骨架搭建 | Phil Liu | 2      | 2025/08/06 | 2025/08/07 | 已完成 |
```

## 注意事项

- 只有"属性"列为"Yes"的任务才会被包含在周报中
- 工作量根据开始和结束日期自动计算（至少1天）
- 日期格式支持多种输入格式，输出统一为YYYY/MM/DD格式
- 状态为"Done"的任务会显示为"已完成"
- 结果直接输出到控制台，不生成文件

## 示例

查看 `example-tasks.csv` 文件了解输入格式，运行后会在控制台显示生成的周报内容。
