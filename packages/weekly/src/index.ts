#!/usr/bin/env node
/* eslint-disable no-console */

import { readFileSync } from 'node:fs'
import process from 'node:process'

interface TaskRecord {
  '属性': string
  'Task Name': string
  'Start Date': string
  'End Date': string
  'Priority': string
  'Status': string
  'Tag': string
  'Person In Charge': string
  'Parent item': string
  'Sub-item': string
}

interface WeeklyReportItem {
  事項: string
  負責人: string
  工作量: number
  開始時間: string
  結束時間: string
  狀態: string
}

function parseCSV(csvContent: string): TaskRecord[] {
  const lines = csvContent.trim().split('\n')

  // 检测分隔符：优先使用逗号，如果没有逗号则使用制表符
  const firstLine = lines[0]
  const hasComma = firstLine.includes(',')
  const hasTab = firstLine.includes('\t')

  let separator = ','
  if (!hasComma && hasTab) {
    separator = '\t'
  }

  const headers = lines[0].split(separator)
  const records: TaskRecord[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator)
    const record: any = {}

    headers.forEach((header, index) => {
      record[header] = values[index] || ''
    })

    records.push(record as TaskRecord)
  }

  return records
}

function calculateWorkload(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 1 // 默认工作量
  }

  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(1, diffDays + 1) // 至少1天
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) {
    return dateStr // 如果解析失败，返回原字符串
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}/${month}/${day}`
}

function convertToWeeklyReport(tasks: TaskRecord[]): WeeklyReportItem[] {
  const personMaps = {
    'Phil Liu': '劉粵',
  }
  return tasks
    .filter(task => task.属性 === 'Yes' && task['Task Name'].trim())
    .map(task => ({
      事項: task['Task Name'].trim(),
      負責人: personMaps[task['Person In Charge'] as keyof typeof personMaps] || task['Person In Charge'] || '未分配',
      工作量: calculateWorkload(task['Start Date'], task['End Date']),
      開始時間: formatDate(task['Start Date']),
      結束時間: formatDate(task['End Date']),
      狀態: task.Status === 'Done' ? '已完成' : task.Status || '進行中',
    }))
}

function generateWeeklyReportMarkdown(items: WeeklyReportItem[]): string {
  const header = `| 事項 | 負責人 | 工作量 | 開始時間 | 結束時間 | 狀態 |
|------|--------|--------|----------|----------|------|`

  const rows = items.map(item =>
    `| ${item.事項} | ${item.負責人} | ${item.工作量} | ${item.開始時間} | ${item.結束時間} | ${item.狀態} |`,
  ).join('\n')

  return `${header}\n${rows}`
}

function main(): void {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('使用方法: node index.js <csv文件路径>')
    console.error('示例: node index.js tasks.csv')
    process.exit(1)
  }

  const inputFile = args[0]

  try {
    const csvContent = readFileSync(inputFile, 'utf-8')

    const tasks = parseCSV(csvContent)

    const weeklyItems = convertToWeeklyReport(tasks)

    const weeklyReport = generateWeeklyReportMarkdown(weeklyItems)

    console.log(`📊 共处理 ${weeklyItems.length} 个任务`)
    console.log('')
    console.log(weeklyReport)
  }
  catch (error) {
    console.error('❌ 处理失败:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()

export {
  convertToWeeklyReport,
  generateWeeklyReportMarkdown,
  parseCSV,
  type TaskRecord,
  type WeeklyReportItem,
}
