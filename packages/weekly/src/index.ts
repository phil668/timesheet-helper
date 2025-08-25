#!/usr/bin/env node
/* eslint-disable no-console */

import { readFileSync } from 'node:fs'
import process from 'node:process'
import { tify } from 'chinese-conv/dist'
import { printTable } from 'console-table-printer'

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
  'Workling Hours': string
}

interface WeeklyReportItem {
  事項: string
  負責人: string
  工作量: number
  開始時間: string
  結束時間: string
  狀態: string
}

interface TimeRange {
  startDate?: Date
  endDate?: Date
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

function calculateWorkload(startDate: string, endDate: string, workingHours?: string): number {
  // 优先使用工时数据
  if (workingHours && workingHours.trim()) {
    const hours = Number.parseFloat(workingHours)
    if (!Number.isNaN(hours) && hours > 0) {
      // 将小时转换为天数，按8小时/天计算
      return Math.round((hours / 8) * 10) / 10 // 保留一位小数
    }
  }

  // 如果没有工时数据，使用日期差计算
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

function isDateInRange(dateStr: string, timeRange: TimeRange): boolean {
  if (!timeRange.startDate && !timeRange.endDate) {
    return true // 如果没有指定时间范围，返回所有任务
  }

  const taskDate = new Date(dateStr)
  if (Number.isNaN(taskDate.getTime())) {
    return false // 如果日期无效，排除该任务
  }

  // 检查开始日期
  if (timeRange.startDate && taskDate < timeRange.startDate) {
    return false
  }

  // 检查结束日期
  if (timeRange.endDate && taskDate > timeRange.endDate) {
    return false
  }

  return true
}

function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)
  return Number.isNaN(date.getTime()) ? null : date
}

function convertToWeeklyReport(tasks: TaskRecord[], timeRange: TimeRange = {}): WeeklyReportItem[] {
  const personMaps = {
    'Phil Liu': '劉粵',
  }
  return tasks
    .filter(task => task['Task Name'].trim())
    .filter((task) => {
      // 检查任务的开始日期或结束日期是否在指定范围内
      const startInRange = isDateInRange(task['Start Date'], timeRange)
      const endInRange = isDateInRange(task['End Date'], timeRange)
      return startInRange || endInRange
    })
    .map(task => ({
      事項: tify(task['Task Name'].trim()),
      負責人: personMaps[task['Person In Charge'] as keyof typeof personMaps] || tify(task['Person In Charge']) || '劉粵',
      工作量: calculateWorkload(task['Start Date'], task['End Date'], task['Workling Hours']),
      開始時間: formatDate(task['Start Date']),
      結束時間: formatDate(task['End Date']),
      狀態: task.Status === 'Done' ? '已完成' : tify(task.Status) || '進行中',
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

function printWeeklyReportTable(items: WeeklyReportItem[]): void {
  const tableData = items.map(item => ({
    事項: item.事項,
    負責人: item.負責人,
    工作量: `${item.工作量}天`,
    開始時間: item.開始時間,
    結束時間: item.結束時間,
    狀態: item.狀態,
  }))

  printTable(tableData, {
    title: '📊 週報任務清單',
    columns: [
      { name: '事項', alignment: 'left' },
      { name: '負責人', alignment: 'center' },
      { name: '工作量', alignment: 'center' },
      { name: '開始時間', alignment: 'center' },
      { name: '結束時間', alignment: 'center' },
      { name: '狀態', alignment: 'center' },
    ],
  })
}

function main(): void {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('使用方法: node index.js <csv文件路徑> [開始日期] [結束日期]')
    console.error('示例: node index.js tasks.csv')
    console.error('示例: node index.js tasks.csv 2024/01/01')
    console.error('示例: node index.js tasks.csv 2024/01/01 2024/01/31')
    console.error('日期格式: YYYY/MM/DD 或 YYYY-MM-DD')
    process.exit(1)
  }

  const inputFile = args[0]
  const startDateStr = args[1]
  const endDateStr = args[2]

  // 解析时间范围
  const timeRange: TimeRange = {}
  if (startDateStr) {
    const startDate = parseDate(startDateStr)
    if (startDate) {
      timeRange.startDate = startDate
    }
    else {
      console.error('❌ 無效的開始日期格式:', startDateStr)
      process.exit(1)
    }
  }

  if (endDateStr) {
    const endDate = parseDate(endDateStr)
    if (endDate) {
      timeRange.endDate = endDate
    }
    else {
      console.error('❌ 無效的結束日期格式:', endDateStr)
      process.exit(1)
    }
  }

  // 显示时间范围信息
  if (timeRange.startDate || timeRange.endDate) {
    console.log('📅 時間範圍:')
    if (timeRange.startDate) {
      console.log(`   開始日期: ${timeRange.startDate.toISOString().split('T')[0]}`)
    }
    if (timeRange.endDate) {
      console.log(`   結束日期: ${timeRange.endDate.toISOString().split('T')[0]}`)
    }
    console.log('')
  }

  try {
    const csvContent = readFileSync(inputFile, 'utf-8')

    const tasks = parseCSV(csvContent)

    const weeklyItems = convertToWeeklyReport(tasks, timeRange)

    console.log(`📊 共處理 ${weeklyItems.length} 個任務`)
    console.log('')

    // 第一次输出：漂亮的终端表格
    printWeeklyReportTable(weeklyItems)

    console.log('')
    console.log('--- Markdown 格式 ---')
    console.log('')

    // 第二次输出：原始markdown格式
    const weeklyReport = generateWeeklyReportMarkdown(weeklyItems)
    console.log(weeklyReport)
  }
  catch (error) {
    console.error('❌ 處理失敗:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()

export {
  convertToWeeklyReport,
  generateWeeklyReportMarkdown,
  isDateInRange,
  parseCSV,
  parseDate,
  printWeeklyReportTable,
  type TaskRecord,
  type TimeRange,
  type WeeklyReportItem,
}
