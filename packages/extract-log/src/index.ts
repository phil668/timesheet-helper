/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable no-console */
import { tify } from 'chinese-conv'
import { GitCommitExtractor } from './git-commit-extractor'
import { OllamaTimeEstimator } from './ollama-time-estimator'
import type { Commit } from './types'

async function main(): Promise<void> {
  const repoPath = '/Users/liuyue/i/work-project/web-utils-library'
  const extractor = new GitCommitExtractor(repoPath)
  const timeEstimator = new OllamaTimeEstimator('http://localhost:11434')

  try {
    const commits = await extractor.extractCommits(
      'liuyue',
      '2025-03-01',
      '2025-03-10',
    )

    const commitStr = commits.map((v) => {
      return `${tify(v.subject)}\n`
    }).join('')
    console.log(commitStr)

    // timeEstimator.estimateTimeForCommits(commits)
  }
  catch (error) {
    console.error('错误:', error)
  }
}

interface ExtractLogParams {
  repoPath: string
  author: string
  startDate: string
  endDate: string
}

async function extractLog(params: ExtractLogParams): Promise<Commit[]> {
  const { repoPath, author, startDate, endDate } = params
  const extractor = new GitCommitExtractor(repoPath)

  const commits = await extractor.extractCommits(
    author,
    startDate,
    endDate,
  )

  return commits
}

main()

export { extractLog }
