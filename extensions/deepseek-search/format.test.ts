import { describe, expect, it } from 'bun:test'
import { cleanMarkdownEscapes, formatSearchResults, truncateContent } from './format'

describe('cleanMarkdownEscapes', () => {
  it('解掉没有语义作用的转义', () => {
    expect(cleanMarkdownEscapes('https\\:\\/\\/api\\.deepseek\\.com')).toBe('https://api.deepseek.com')
    expect(cleanMarkdownEscapes('\\# 标题')).toBe('# 标题')
    expect(cleanMarkdownEscapes('\\- 列表项')).toBe('- 列表项')
    expect(cleanMarkdownEscapes('引号\\"文本\\"')).toBe('引号"文本"')
  })

  it('解掉表格竖线转义，让表格能渲染', () => {
    expect(cleanMarkdownEscapes('API \\| Endpoint')).toBe('API | Endpoint')
  })

  it('保留强调与链接语法需要的转义', () => {
    expect(cleanMarkdownEscapes('\\*不是斜体\\*')).toBe('\\*不是斜体\\*')
    expect(cleanMarkdownEscapes('snake\\_case')).toBe('snake\\_case')
    expect(cleanMarkdownEscapes('[链接\\]')).toBe('[链接\\]')
  })

  it('不动转义反斜杠本身', () => {
    expect(cleanMarkdownEscapes('C:\\\\path')).toBe('C:\\\\path')
  })
})

describe('truncateContent', () => {
  it('短内容不截断', () => {
    const { text, truncated } = truncateContent('标题', 'https://a.com', '正文', 100)
    expect(truncated).toBe(false)
    expect(text).toContain('# 标题')
    expect(text).toContain('来源：https://a.com')
    expect(text).toContain('正文')
  })

  it('超长内容截断并给出原文长度', () => {
    const { text, truncated } = truncateContent('T', 'https://a.com', 'x'.repeat(500), 100)
    expect(truncated).toBe(true)
    expect(text).toContain('已截断')
    expect(text).toContain('500')
  })
})

describe('formatSearchResults', () => {
  const base = {
    rerank_score: 2.04,
    title: '结果标题',
    url: 'https://a.com/p',
    snippet: '短摘要',
    summary: '长摘要',
    content: '',
    site_name: '示例站',
    site_icon: null,
    date: '2026-07-08T16:00:00+00:00',
    authority: 3,
  }

  it('空结果给出可执行的建议', () => {
    expect(formatSearchResults('查询', [], false)).toContain('没有找到')
  })

  it('渲染相关度、权威度与日期', () => {
    const text = formatSearchResults('查询', [base], false)
    expect(text).toContain('示例站 — 结果标题')
    expect(text).toContain('https://a.com/p')
    expect(text).toContain('相关度 2.0')
    expect(text).toContain('权威度 3')
    expect(text).toContain('2026-07-08')
    expect(text).toContain('长摘要')
  })

  it('authority 为 -1（未知）时不展示', () => {
    const text = formatSearchResults('查询', [{ ...base, authority: -1 }], false)
    expect(text).not.toContain('权威度')
  })
})
