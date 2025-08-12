export interface Commit {
  hash: string
  authorName: string
  authorEmail: string
  date: Date
  subject: string
  repoPath?: string
  branch?: string
}

export interface Repository {
  path: string
  branches?: string[]
}

export interface ExtractLogParams {
  repositories: Repository[]
  author: string
  startDate: string
  endDate: string
  outputPath?: string
}
