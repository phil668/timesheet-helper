import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import type { Commit } from './types'

const execAsync = promisify(exec)

export class GitCommitExtractor {
  private repoPath: string

  constructor(repoPath: string) {
    this.repoPath = repoPath
  }

  async extractCommits(author: string, startDate: string, endDate: string, branches?: string[]): Promise<Commit[]> {
    let allCommits: Commit[] = []

    if (!branches || branches.length === 0) {
      // 如果没有指定分支，获取所有分支的提交
      const cmd = `git -C "${this.repoPath}" log --author="${author}" --since="${startDate}" --until="${endDate}" --all --format="%H|%an|%ae|%ad|%s"`
      try {
        const { stdout } = await execAsync(cmd)
        allCommits = this.parseGitOutput(stdout, this.repoPath)
      }
      catch (error) {
        throw new Error(`Git命令执行失败: ${error}`)
      }
    }
    else {
      // 如果指定了分支，分别获取每个分支的提交
      for (const branch of branches) {
        try {
          const cmd = `git -C "${this.repoPath}" log --author="${author}" --since="${startDate}" --until="${endDate}" ${branch} --format="%H|%an|%ae|%ad|%s"`
          const { stdout } = await execAsync(cmd)
          const branchCommits = this.parseGitOutput(stdout, this.repoPath, branch)
          allCommits.push(...branchCommits)
        }
        catch (error) {
          console.warn(`警告: 无法获取分支 ${branch} 的提交: ${error}`)
        }
      }
    }

    return allCommits
  }

  private parseGitOutput(output: string, repoPath: string, branch?: string): Commit[] {
    return output
      .trim()
      .split('\n')
      .filter(line => line.trim() !== '')
      .map((line) => {
        const [hash, authorName, authorEmail, dateStr, subject] = line.split('|')
        return {
          hash,
          authorName,
          authorEmail,
          date: new Date(dateStr),
          subject: this.removeCommitPrefix(subject),
          repoPath,
          branch,
        }
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  private removeCommitPrefix(subject: string): string {
    // 移除类似 "feat(utils): " 的前缀
    const prefixRegex = /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)(\([^)]+\))?[：:]\s*/
    return subject.replace(prefixRegex, '')
  }
}
