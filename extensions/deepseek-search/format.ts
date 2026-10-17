// @env node
import type { DeepSeekSearchItem } from './client'

/** 每条搜索结果里正文的截断长度，避免单条结果吃掉整个上下文。 */
const CONTENT_PREVIEW_CHARS = 1_200

function formatDate(value: string | null): string {
  if (!value)
    return ''
  return value.slice(0, 10)
}

/** 把一条结果渲染成模型友好的紧凑文本块。 */
function formatItem(item: DeepSeekSearchItem, index: number, withContent: boolean): string {
  const lines: string[] = []
  const meta: string[] = []

  if (typeof item.rerank_score === 'number')
    meta.push(`相关度 ${item.rerank_score.toFixed(1)}`)
  if (typeof item.authority === 'number' && item.authority >= 0)
    meta.push(`权威度 ${item.authority}`)
  const date = formatDate(item.date)
  if (date)
    meta.push(date)

  const heading = item.site_name ? `${item.site_name} — ${item.title}` : item.title
  lines.push(`${index + 1}. ${heading}`)
  lines.push(`   ${item.url}`)
  if (meta.length)
    lines.push(`   [${meta.join(' · ')}]`)

  const summary = item.summary || item.snippet
  if (summary)
    lines.push(`   ${summary.trim()}`)

  if (withContent && item.content) {
    const body = item.content.trim()
    const shown = body.length > CONTENT_PREVIEW_CHARS
      ? `${body.slice(0, CONTENT_PREVIEW_CHARS)}…（正文共 ${body.length} 字符，需要全文请用 deepseek_fetch 抓取该 URL）`
      : body
    lines.push(`   正文：${shown}`)
  }

  return lines.join('\n')
}

export function formatSearchResults(
  query: string,
  items: DeepSeekSearchItem[],
  withContent: boolean,
): string {
  if (items.length === 0)
    return `没有找到「${query}」的结果。可以放宽检索条件，或改用通用搜索。`

  const blocks = items.map((item, index) => formatItem(item, index, withContent))
  return `「${query}」共 ${items.length} 条结果：\n\n${blocks.join('\n\n')}`
}

export function truncateContent(
  title: string,
  url: string,
  content: string,
  maxChars: number,
): { text: string, truncated: boolean } {
  const body = content.trim()
  const header = title ? `# ${title}\n来源：${url}\n\n` : `来源：${url}\n\n`

  if (body.length <= maxChars)
    return { text: header + body, truncated: false }

  return {
    text: `${header}${body.slice(0, maxChars)}\n\n…（已截断：原文共 ${body.length} 字符，本次显示 ${maxChars} 字符）`,
    truncated: true,
  }
}
