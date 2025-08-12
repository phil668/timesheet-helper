import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable no-console */
import { tify } from 'chinese-conv'
import { GitCommitExtractor } from './git-commit-extractor'
import { OllamaTimeEstimator } from './ollama-time-estimator'
import type { Commit, ExtractLogParams, Repository } from './types'

function generateMarkdownReport(commits: Commit[], author: string, startDate: string, endDate: string): string {
  const title = `# Git提交记录报告\n\n`

  // 统计仓库数量
  const uniqueRepos = new Set(commits.map(c => c.repoPath).filter(Boolean))
  const repoCount = uniqueRepos.size

  const summary = `## 摘要\n\n- **作者**: ${author}\n- **时间范围**: ${startDate} 至 ${endDate}\n- **提交总数**: ${commits.length}${repoCount > 1 ? `\n- **仓库数量**: ${repoCount}` : ''}\n\n`

  // 根据是否有仓库信息决定表格列
  const hasRepoInfo = commits.some(c => c.repoPath || c.branch)
  const tableHeader = hasRepoInfo
    ? `## 提交详情\n\n| 序号 | 提交信息 | 提交时间 | 作者 | 仓库 | 分支 |\n|------|----------|----------|------|------|------|\n`
    : `## 提交详情\n\n| 序号 | 提交信息 | 提交时间 | 作者 |\n|------|----------|----------|------|\n`

  const tableRows = commits.map((commit, index) => {
    const date = commit.date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '')

    if (hasRepoInfo) {
      const repoName = commit.repoPath ? path.basename(commit.repoPath) : '-'
      const branchName = commit.branch || '-'
      return `| ${index + 1} | ${tify(commit.subject)} | ${date} | ${commit.authorName} | ${repoName} | ${branchName} |`
    }
    else {
      return `| ${index + 1} | ${tify(commit.subject)} | ${date} | ${commit.authorName} |`
    }
  }).join('\n')

  return `${title + summary + tableHeader + tableRows}\n`
}

async function main(): Promise<void> {
  const repositories: Repository[] = [
    {
      path: '/Users/liuyue/i/work-project/sail',
      branches: ['dev/v2', 'dev/v3'],
    },
    {
      path: '/Users/liuyue/i/work-project/sail-portal',
      branches: ['main'],
    },
  ]
  const timeEstimator = new OllamaTimeEstimator('http://localhost:11434')

  try {
    const commits = await extractLog({
      repositories,
      author: 'liuyue',
      startDate: '2025-07-01',
      endDate: '2025-07-31',
      outputPath: path.join(process.cwd(), 'git-commits-report.md'),
    })

    const commitStr = commits.map((v) => {
      return `${tify(v.subject)}\n`
    }).join('')

    // timeEstimator.estimateTimeForCommits(commits)
  }
  catch (error) {
    console.error('错误:', error)
  }
}

async function extractLog(params: ExtractLogParams): Promise<Commit[]> {
  const { repositories, author, startDate, endDate, outputPath } = params
  const allCommits: Commit[] = []

  // 遍历所有仓库
  for (const repo of repositories) {
    const extractor = new GitCommitExtractor(repo.path)

    try {
      const commits = await extractor.extractCommits(
        author,
        startDate,
        endDate,
        repo.branches,
      )
      allCommits.push(...commits)
    }
    catch (error) {
      console.warn(`警告: 无法从仓库 ${repo.path} 提取提交: ${error}`)
    }
  }

  // 去重：基于提交信息去重，保留最新的提交
  const uniqueCommits = allCommits.reduce((acc, commit) => {
    const existingIndex = acc.findIndex(c => c.subject === commit.subject)
    if (existingIndex === -1) {
      acc.push(commit)
    }
    else {
      // 如果已存在相同提交信息，保留时间最新的
      if (commit.date > acc[existingIndex].date) {
        acc[existingIndex] = commit
      }
    }
    return acc
  }, [] as Commit[])

  // 按时间排序（最早的在前）
  uniqueCommits.sort((a, b) => a.date.getTime() - b.date.getTime())

  // 如果指定了输出路径，生成Markdown报告
  if (outputPath) {
    const markdownContent = generateMarkdownReport(uniqueCommits, author, startDate, endDate)
    fs.writeFileSync(outputPath, markdownContent, 'utf-8')
    console.log(`Markdown报告已生成: ${outputPath}`)
  }

  return uniqueCommits
}

main()

export { extractLog }
