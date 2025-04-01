import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import type { Commit } from './types'

const execAsync = promisify(exec)

export class GitCommitExtractor {
  private repoPath: string

  constructor(repoPath: string) {
    this.repoPath = repoPath
  }

  async extractCommits(author: string, startDate: string, endDate: string): Promise<Commit[]> {
    const cmd = `git -C "${this.repoPath}" log --author="${author}" --since="${startDate}" --until="${endDate}" --format="%H|%an|%ae|%ad|%s"`

    try {
      const { stdout } = await execAsync(cmd)
      return this.parseGitOutput(stdout)
    }
    catch (error) {
      throw new Error(`Git命令执行失败: ${error}`)
    }
  }

  private parseGitOutput(output: string): Commit[] {
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
