import http from 'node:http'
import type { Commit } from './types'

interface CommitEstimate {
  commit: Commit
  estimatedTime: number
}

export class OllamaTimeEstimator {
  private ollamaUrl: string
  private model: string

  constructor(ollamaUrl: string = 'http://localhost:11434', model: string = 'llama3.1') {
    this.ollamaUrl = ollamaUrl
    this.model = model
  }

  async estimateTimeForCommits(commits: Commit[]): Promise<CommitEstimate[]> {
    const prompt = this.createPromptForCommits(commits)

    try {
      const response = await this.queryOllama(prompt)
      const commitEstimates = this.parseResponse(response, commits)
      return commitEstimates
    }
    catch (error) {
      console.error('Error estimating time:', error)
      return commits.map(commit => ({ commit, estimatedTime: 0 }))
    }
  }

  private createPromptForCommits(commits: Commit[]): string {
    const totalTime = 90
    let prompt = `Estimate the time in hours for each of the following ${commits.length} commits. 
Please follow these guidelines:
1. The total time for all commits should be approximately ${totalTime} hours.
2. Each commit should be estimated between 1 to 4 hours, depending on its complexity.
3. Use only whole numbers or .5 for your estimates (e.g., 1, 1.5, 2, 2.5, 3, 3.5, 4).
4. Adjust the time based on the apparent difficulty of each commit, but ensure the total remains close to ${totalTime} hours.

Here are the commits:\n\n`
    commits.forEach((commit, index) => {
      prompt += `Commit ${index + 1}:\n`
      prompt += `Hash ${commit.hash}:\n`
      prompt += `Message: ${commit.subject}\n`
    })
    prompt += 'Provide your estimates in the following format:\n'
    prompt += 'Commit hash value: X hours\nCommit hash value: Y hours\n...'
    return prompt
  }

  private queryOllama(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        model: this.model,
        prompt,
        format: 'json',
        stream: false,
      })

      const options = {
        hostname: new URL(this.ollamaUrl).hostname,
        port: new URL(this.ollamaUrl).port,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const req = http.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          resolve(JSON.parse(data).response)
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.write(postData)
      req.end()
    })
  }

  private parseResponse(response: string, commits: Commit[]): CommitEstimate[] {
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
}
