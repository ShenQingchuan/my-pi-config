// @env node
/**
 * DeepSeek Search / Fetch API 客户端。
 * 文档：https://api-docs.deepseek.com/zh-cn/guides/search
 */

export interface DeepSeekSearchItem {
  rerank_score: number
  title: string
  url: string
  snippet: string
  summary: string
  content: string
  site_name: string | null
  site_icon: string | null
  date: string | null
  authority: number
}

export interface DeepSeekSearchParams {
  query: string
  count?: number
  ori_question?: string
  localization?: string
  need_content?: boolean
}

export interface DeepSeekFetchResult {
  title: string
  content: string
}

interface DeepSeekErrorBody {
  error?: { message?: string, type?: string, code?: string }
}

const DEFAULT_BASE_URL = 'https://api.deepseek.com'

export function resolveBaseUrl(): string {
  const raw = process.env.DEEPSEEK_BASE_URL?.trim()
  return (raw || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

async function postJson<T>(path: string, apiKey: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${resolveBaseUrl()}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: signal ?? AbortSignal.timeout(60_000),
  })

  const raw = await response.text()

  if (!response.ok) {
    let detail = raw.trim()
    try {
      const parsed = JSON.parse(raw) as DeepSeekErrorBody
      detail = parsed.error?.message ?? detail
    }
    catch {
      // 非 JSON 错误体，保留原始文本
    }
    throw new Error(`DeepSeek ${path} 失败（HTTP ${response.status}）：${detail || response.statusText}`)
  }

  return JSON.parse(raw) as T
}

export async function search(
  apiKey: string,
  params: DeepSeekSearchParams,
  signal?: AbortSignal,
): Promise<DeepSeekSearchItem[]> {
  const body: Record<string, unknown> = { query: params.query }
  if (params.count !== undefined)
    body.count = params.count
  if (params.ori_question)
    body.ori_question = params.ori_question
  if (params.localization)
    body.localization = params.localization
  if (params.need_content !== undefined)
    body.need_content = params.need_content

  const data = await postJson<{ results?: DeepSeekSearchItem[] }>('/v1/tools/search', apiKey, body, signal)
  return data.results ?? []
}

export async function fetchPage(
  apiKey: string,
  url: string,
  signal?: AbortSignal,
): Promise<DeepSeekFetchResult> {
  return postJson<DeepSeekFetchResult>('/v1/tools/fetch', apiKey, { url }, signal)
}
