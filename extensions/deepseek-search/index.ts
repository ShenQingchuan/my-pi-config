/**
 * pi-deepseek-search —— 把 DeepSeek 的 Search / Fetch API 接成 Pi 工具。
 *
 * 与 AnySearch MCP 的分工：
 * - deepseek_search：需要精确检索语法（site: / after: / lang: / "短语"）、
 *   或需要权威度、时效评分时用它；结果带 rerank_score 与 authority。
 * - deepseek_fetch：把单个网页抓成干净 Markdown，适合读全文。
 * - AnySearch：广泛检索、垂直领域、批量并发。
 *
 * 密钥复用 Pi 里已保存的 DeepSeek 凭证，无需额外配置。
 */

import type { ExtensionAPI, ExtensionToolContext } from '@earendil-works/pi-coding-agent'
import { defineTool } from '@earendil-works/pi-coding-agent'
import { Type } from 'typebox'
import { fetchPage, search } from './client'
import { formatSearchResults, truncateContent } from './format'

const DEFAULT_MAX_CHARS = 20_000

async function resolveApiKey(ctx: ExtensionToolContext): Promise<string> {
  const fromRegistry = await ctx.modelRegistry.getApiKeyForProvider('deepseek')
  const key = fromRegistry ?? process.env.DEEPSEEK_API_KEY
  if (!key)
    throw new Error('找不到 DeepSeek API Key。请先运行 `pi auth` 配置 deepseek 凭证，或设置 DEEPSEEK_API_KEY 环境变量。')
  return key
}

const searchTool = defineTool({
  name: 'deepseek_search',
  label: 'DeepSeek Search',
  description: [
    '用 DeepSeek 自研搜索引擎检索网页，返回带相关度、权威度、发布时间评分的结构化结果。',
    '支持检索语法：site: / -site: / -词 / "精确短语" / lang:zh,en / after:2025-01-01 / before:2026-01-01。',
    '适合：查官方文档、限定站点或时间窗口内的事实、需要高权威来源的核对。',
    '不适合：需要大批量并发检索时，改用 anysearch 的 batch_search。',
  ].join(' '),
  promptSnippet: 'deepseek_search: 精确语法网页检索（site:/after:/lang:/"短语"），结果带权威度与时效评分',
  promptGuidelines: [
    '需要限定站点、时间范围或语言时，用 deepseek_search 而不是通用搜索。',
    'deepseek_search 结果里的 rerank_score >= 1.5、authority >= 3 视为高质量来源，引用前优先采用。',
  ],
  parameters: Type.Object({
    query: Type.String({
      maxLength: 128,
      description: '检索词，1~128 字符。可组合 site:、after:、before:、lang:、"精确短语"、-排除词 等语法。',
    }),
    count: Type.Optional(Type.Integer({
      minimum: 1,
      maximum: 50,
      default: 10,
      description: '返回条数，1~50，默认 10。',
    })),
    ori_question: Type.Optional(Type.String({
      maxLength: 128,
      description: '触发本次检索的用户原始问题，帮助理解检索意图。',
    })),
    need_content: Type.Optional(Type.Boolean({
      default: false,
      description: '是否同时返回网页正文（每条截断展示）。需要完整正文时改用 deepseek_fetch。',
    })),
  }),

  async execute(_toolCallId, params, signal, _onUpdate, ctx) {
    const apiKey = await resolveApiKey(ctx)
    const items = await search(apiKey, {
      query: params.query,
      count: params.count,
      ori_question: params.ori_question,
      need_content: params.need_content,
    }, signal)

    return {
      content: [{ type: 'text', text: formatSearchResults(params.query, items, params.need_content === true) }],
      details: { count: items.length, query: params.query },
    }
  },
})

const fetchTool = defineTool({
  name: 'deepseek_fetch',
  label: 'DeepSeek Fetch',
  description: [
    '抓取单个网页并返回 Markdown 正文与标题。',
    '适合读取 deepseek_search 找到的页面全文、或已知 URL 的文档内容。',
    '结果受目标站点可用性与访问策略影响。',
  ].join(' '),
  promptSnippet: 'deepseek_fetch: 把一个网页抓成 Markdown 全文',
  parameters: Type.Object({
    url: Type.String({
      maxLength: 8192,
      description: '要抓取的 HTTP/HTTPS 地址，必须带 host，不能包含用户名或密码。',
    }),
    max_chars: Type.Optional(Type.Integer({
      minimum: 1_000,
      maximum: 200_000,
      default: DEFAULT_MAX_CHARS,
      description: `正文最多返回多少字符，默认 ${DEFAULT_MAX_CHARS}。超出会截断并提示。`,
    })),
  }),

  async execute(_toolCallId, params, signal, _onUpdate, ctx) {
    const apiKey = await resolveApiKey(ctx)
    const page = await fetchPage(apiKey, params.url, signal)
    const { text, truncated } = truncateContent(
      page.title,
      params.url,
      page.content ?? '',
      params.max_chars ?? DEFAULT_MAX_CHARS,
    )

    return {
      content: [{ type: 'text', text }],
      details: { url: params.url, title: page.title, truncated },
    }
  },
})

export default function (pi: ExtensionAPI) {
  pi.registerTool(searchTool)
  pi.registerTool(fetchTool)
}
