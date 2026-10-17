// @env node
/**
 * 阶段 1：探针采样。
 * 同一批问题打给目标模型，每个跑 N 次，结果存成 JSONL，用来提取说话风格。
 *
 * 用法：bun run research/gemini-voice/run-probes.ts
 * 需要环境变量 SUB2TOK_API_KEY。
 */

import { appendFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

interface Probe {
  id: string
  register: string
  source: 'real' | 'designed'
  prompt: string
}

interface ProbesFile {
  model: string
  samples: number
  concurrency: number
  probes: Probe[]
}

interface Sample {
  probeId: string
  register: string
  source: string
  sampleIndex: number
  model: string
  content: string
  completionTokens: number | null
  latencyMs: number
  error?: string
}

const ROOT = dirname(new URL(import.meta.url).pathname)
const ENDPOINT = 'https://api.sub2tok.com/v1/chat/completions'

async function callModel(model: string, prompt: string, apiKey: string): Promise<Omit<Sample, 'probeId' | 'register' | 'source' | 'sampleIndex'>> {
  const started = Date.now()
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(180_000),
  })

  const raw = await response.text()
  const latencyMs = Date.now() - started

  if (!response.ok) {
    return { model, content: '', completionTokens: null, latencyMs, error: `HTTP ${response.status}: ${raw.slice(0, 300)}` }
  }

  const data = JSON.parse(raw) as {
    choices?: Array<{ message?: { content?: string } }>
    usage?: { completion_tokens?: number }
  }
  return {
    model,
    content: data.choices?.[0]?.message?.content ?? '',
    completionTokens: data.usage?.completion_tokens ?? null,
    latencyMs,
  }
}

async function main(): Promise<void> {
  const apiKey = process.env.SUB2TOK_API_KEY
  if (!apiKey) {
    console.error('缺少 SUB2TOK_API_KEY 环境变量')
    process.exit(1)
  }

  const config = JSON.parse(await Bun.file(join(ROOT, 'probes.json')).text()) as ProbesFile
  const tasks: Array<{ probe: Probe, sampleIndex: number }> = []
  for (const probe of config.probes) {
    for (let i = 0; i < config.samples; i++)
      tasks.push({ probe, sampleIndex: i })
  }

  console.log(`共 ${tasks.length} 次调用（${config.probes.length} 个探针 × ${config.samples} 次），并发 ${config.concurrency}`)

  const outDir = join(ROOT, 'corpus')
  await mkdir(outDir, { recursive: true })
  const outFile = join(outDir, `${config.model}-${new Date().toISOString().slice(0, 10)}.jsonl`)
  await writeFile(outFile, '')

  const results: Sample[] = []
  let cursor = 0
  let done = 0

  async function worker(): Promise<void> {
    while (cursor < tasks.length) {
      const task = tasks[cursor++]
      const attempt = async (retries: number): Promise<Sample> => {
        let sample: Sample
        try {
          const r = await callModel(config.model, task.probe.prompt, apiKey)
          sample = {
            probeId: task.probe.id,
            register: task.probe.register,
            source: task.probe.source,
            sampleIndex: task.sampleIndex,
            ...r,
          }
        }
        catch (error) {
          sample = {
            probeId: task.probe.id,
            register: task.probe.register,
            source: task.probe.source,
            sampleIndex: task.sampleIndex,
            model: config.model,
            content: '',
            completionTokens: null,
            latencyMs: 0,
            error: `抛错: ${String(error).slice(0, 200)}`,
          }
        }
        if (sample.error && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000 * (4 - retries)))
          return attempt(retries - 1)
        }
        return sample
      }
      const sample = await attempt(3)
      results.push(sample)
      await appendFile(outFile, `${JSON.stringify(sample)}\n`)
      done++
      const note = sample.error ? `失败: ${sample.error.slice(0, 60)}` : `${sample.content.length} 字 / ${sample.latencyMs}ms`
      console.log(`[${done}/${tasks.length}] ${task.probe.id}#${task.sampleIndex} — ${note}`)
    }
  }

  await Promise.all(Array.from({ length: config.concurrency }, () => worker()))

  const failed = results.filter(r => r.error).length
  console.log(`\n完成：${results.length - failed} 成功，${failed} 失败`)
  console.log(`样本文件：${outFile}`)
}

await main()
