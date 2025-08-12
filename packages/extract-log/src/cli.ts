#!/usr/bin/env node
/* eslint-disable no-console */

import * as path from 'node:path'
import * as process from 'node:process'
import { extractLog } from './index'
import type { Repository } from './types'

interface CLIOptions {
  repositories: Repository[]
  author: string
  startDate: string
  endDate: string
  output?: string
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2)
  const options: Partial<CLIOptions> = { repositories: [] }
  let currentRepo: Partial<Repository> = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--repo':
      case '-r':
        // 如果已经有仓库信息，先保存
        if (currentRepo.path) {
          options.repositories!.push(currentRepo as Repository)
        }
        currentRepo = { path: args[++i] }
        break
      case '--branch':
      case '-b':
        if (!currentRepo.branches) {
          currentRepo.branches = []
        }
        currentRepo.branches.push(args[++i])
        break
      case '--author':
      case '-a':
        options.author = args[++i]
        break
      case '--start-date':
      case '-s':
        options.startDate = args[++i]
        break
      case '--end-date':
      case '-e':
        options.endDate = args[++i]
        break
      case '--output':
      case '-o':
        options.output = args[++i]
        break
      case '--help':
      case '-h':
        showHelp()
        process.exit(0)
        break
    }
  }

  // 保存最后一个仓库
  if (currentRepo.path) {
    options.repositories!.push(currentRepo as Repository)
  }

  // 验证必需参数
  if (!options.repositories || options.repositories.length === 0 || !options.author || !options.startDate || !options.endDate) {
    console.error('错误: 缺少必需参数')
    showHelp()
    process.exit(1)
  }

  return options as CLIOptions
}

function showHelp(): void {
  console.log(`
Git提交记录提取工具

用法:
  npx extract-log [选项]

选项:
  -r, --repo <path>         Git仓库路径 (必需，可多次使用)
  -b, --branch <name>       分支名称 (可选，可多次使用)
  -a, --author <name>       作者名称 (必需)
  -s, --start-date <date>   开始日期 (YYYY-MM-DD) (必需)
  -e, --end-date <date>     结束日期 (YYYY-MM-DD) (必需)
  -o, --output <file>       输出文件路径 (可选，默认为 git-commits-report.md)
  -h, --help                显示帮助信息

说明:
  生成的Markdown报告包含表格格式的提交记录，包括序号、提交信息、提交时间和作者信息。
  自动去重：相同提交信息的记录会保留最新的，并按时间正序排列。
  支持多仓库和多分支：所有仓库和分支的提交会汇总后统一去重和排序。

示例:
  # 单个仓库，所有分支
  npx extract-log -r /path/to/repo -a "张三" -s 2025-01-01 -e 2025-01-31

  # 单个仓库，指定分支
  npx extract-log -r /path/to/repo -b main -b develop -a "张三" -s 2025-01-01 -e 2025-01-31

  # 多个仓库
  npx extract-log -r /path/to/repo1 -b main -r /path/to/repo2 -b develop -a "张三" -s 2025-01-01 -e 2025-01-31

  # 指定输出文件
  npx extract-log -r /path/to/repo -a "张三" -s 2025-01-01 -e 2025-01-31 -o my-report.md
`)
}

async function main(): Promise<void> {
  try {
    const options = parseArgs()

    // 设置默认输出路径
    const outputPath = options.output || path.join(process.cwd(), 'git-commits-report.md')

    console.log('正在提取Git提交记录...')
    console.log(`仓库数量: ${options.repositories.length}`)
    options.repositories.forEach((repo, index) => {
      console.log(`  仓库 ${index + 1}: ${repo.path}`)
      if (repo.branches && repo.branches.length > 0) {
        console.log(`    分支: ${repo.branches.join(', ')}`)
      }
      else {
        console.log(`    分支: 所有分支`)
      }
    })
    console.log(`作者: ${options.author}`)
    console.log(`时间范围: ${options.startDate} 至 ${options.endDate}`)
    console.log(`输出文件: ${outputPath}`)

    const commits = await extractLog({
      repositories: options.repositories,
      author: options.author,
      startDate: options.startDate,
      endDate: options.endDate,
      outputPath,
    })

    console.log(`\n✅ 成功提取 ${commits.length} 条提交记录`)
    console.log(`📄 Markdown报告已生成: ${outputPath}`)
  }
  catch (error) {
    console.error('❌ 错误:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
