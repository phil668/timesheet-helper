# Timesheet Helper

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

Git提交记录提取工具，生成Markdown表格报告

> **功能**:
> 从多个Git仓库和分支中提取指定作者的提交记录，生成包含提交信息和时间的Markdown表格报告。

## 安装

```bash
npm install extract-log
```

## 使用方法

### 命令行工具

```bash
npx extract-log -r /path/to/repo -b main -b develop -a "作者名" -s 2025-01-01 -e 2025-01-31 -o report.md
```

### 参数说明

- `-r, --repo <path>`: Git仓库路径 (必需，可多次使用指定多个仓库)
- `-b, --branch <name>`: 分支名称 (可选，可多次使用指定多个分支)
- `-a, --author <name>`: 作者名称 (必需)
- `-s, --start-date <date>`: 开始日期 (YYYY-MM-DD) (必需)
- `-e, --end-date <date>`: 结束日期 (YYYY-MM-DD) (必需)
- `-o, --output <file>`: 输出文件路径 (可选，默认为 git-commits-report.md)
- `-h, --help`: 显示帮助信息

### 示例

```bash
# 单个仓库，所有分支
npx extract-log -r /Users/username/project -a "张三" -s 2025-01-01 -e 2025-01-31

# 单个仓库，指定分支
npx extract-log -r /Users/username/project -b main -b develop -a "张三" -s 2025-01-01 -e 2025-01-31

# 多个仓库
npx extract-log -r /Users/username/project1 -b main -r /Users/username/project2 -b develop -a "张三" -s 2025-01-01 -e 2025-01-31

# 指定输出文件
npx extract-log -r /Users/username/project -a "张三" -s 2025-01-01 -e 2025-01-31 -o my-report.md
```

### 生成的报告格式

生成的Markdown报告包含以下内容：

1. **摘要信息**: 作者、时间范围、提交总数
2. **提交详情表格**: 包含序号、提交信息、提交时间、作者
3. **自动去重**: 相同提交信息的记录会保留最新的，并按时间正序排列
4. **多仓库支持**: 支持同时从多个Git仓库提取提交记录
5. **多分支支持**: 支持指定特定分支或所有分支

示例报告格式：

```markdown
# Git提交记录报告

## 摘要

- **作者**: 张三
- **时间范围**: 2025-01-01 至 2025-01-31
- **提交总数**: 5

## 提交详情

| 序号 | 提交信息 | 提交时间 | 作者 |
|------|----------|----------|------|
| 1 | 修复登录功能 | 20250115 | 张三 |
| 2 | 添加新功能 | 20250120 | 张三 |
```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2024-PRESENT [Anthony Fu](https://github.com/antfu)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/pkg-placeholder?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/pkg-placeholder
[npm-downloads-src]: https://img.shields.io/npm/dm/pkg-placeholder?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/pkg-placeholder
[bundle-src]: https://img.shields.io/bundlephobia/minzip/pkg-placeholder?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=pkg-placeholder
[license-src]: https://img.shields.io/github/license/antfu/pkg-placeholder.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/antfu/pkg-placeholder/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/pkg-placeholder
