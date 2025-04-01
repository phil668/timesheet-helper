import OpenAI from 'openai'
import type { Commit } from './types'

interface CommitEstimate {
  commit: Commit
  estimatedTime: number
}

export class AITimeEstimator {
  private openai: OpenAI

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
  }

  async estimateTime(commits: Commit[]): Promise<void> {
    const prompt = this.createPromptForCommits(commits)

    try {
      const response = await this.openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo',
      })

      const content = response.choices[0].message?.content
      if (!content) {
        throw new Error('No response from AI')
      }
    }
    catch (error) {
      console.error('Error estimating time:', error)
    }
  }

  private parseAIResponse(response: string, commits: Commit[]): CommitEstimate[] {
    const lines = response.split('\n')
    return commits.map((commit, index) => {
      const line = lines.find(l => l.startsWith(`Commit ${index + 1}:`))
      let estimatedTime = 0
      if (line) {
        const match = line.match(/(\d+(\.\d+)?)\s*hours?/)
        if (match) {
          estimatedTime = Number.parseFloat(match[1])
        }
      }
      return { commit, estimatedTime }
    })
  }

  private createPromptForCommits(commits: Commit[]): string {
    let prompt = 'Estimate the time in hours for each of the following commits:\n\n'
    commits.forEach((commit, index) => {
      prompt += `Commit ${index + 1}:\n`
      prompt += `Message: ${commit.subject}\n`
    })
    prompt += 'Provide your estimates in the following format:\n'
    prompt += 'Commit 1: X hours\nCommit 2: Y hours\n...'
    return prompt
  }
}
