import fs from 'node:fs'
import path from 'node:path'
import { GoogleGenAI } from '@google/genai'
import type { PipelineContext } from '../types'
import { log } from '../logger'

type GeminiTransformResponse = {
  fileContent: string
  messages: Record<string, string>
}

const geminiApiKey = process.env.GEMINI_API_KEY

/** Strip optional markdown code fences so we can parse JSON from Gemini (e.g. "```json\n{...}\n```"). */
function extractJson(text: string): string {
  const trimmed = text.trim()
  if (!trimmed.startsWith('```')) return trimmed
  // Skip opening fence: ``` then optional language id (e.g. json) then newline or space
  let start = 3
  while (start < trimmed.length && /[a-z]/i.test(trimmed[start])) start += 1
  while (start < trimmed.length && (trimmed[start] === '\n' || trimmed[start] === ' ')) start += 1
  const rest = trimmed.slice(start)
  const closeIdx = rest.indexOf('```')
  return closeIdx === -1 ? rest.trim() : rest.slice(0, closeIdx).trim()
}

/**
 * Strip trailing commas before } or ] to fix common JSON errors.
 */
function stripTrailingCommas(jsonText: string): string {
  // Remove trailing commas before } or ]
  return jsonText.replace(/,(\s*[}\]])/g, '$1')
}

/**
 * Extract JSON object from text by finding first { and last }.
 */
function extractJsonObject(text: string): string {
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return text
  }
  return text.slice(firstBrace, lastBrace + 1)
}

/**
 * Repair JSON when Gemini returns literal newlines/control chars inside "fileContent" string.
 * JSON does not allow unescaped control characters in string literals; this rewrites the
 * fileContent value to use \\n etc. so JSON.parse can succeed.
 */
function repairFileContentJson(jsonText: string): string {
  const key = '"fileContent"'
  const keyIdx = jsonText.indexOf(key)
  if (keyIdx === -1) return jsonText
  // Find the opening quote of the value (after ": ")
  const valueStartIdx = jsonText.indexOf('"', keyIdx + key.length)
  if (valueStartIdx === -1) return jsonText
  const contentStart = valueStartIdx + 1
  let i = contentStart
  let repaired = ''
  while (i < jsonText.length) {
    const c = jsonText[i]
    if (c === '\\') {
      repaired += jsonText.slice(i, i + 2)
      i += 2
      continue
    }
    if (c === '"') break
    if (c === '\n') {
      repaired += '\\n'
      i += 1
      continue
    }
    if (c === '\r') {
      repaired += '\\r'
      i += 1
      continue
    }
    if (c === '\t') {
      repaired += '\\t'
      i += 1
      continue
    }
    if (c.charCodeAt(0) < 32) {
      repaired += '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')
      i += 1
      continue
    }
    repaired += c
    i += 1
  }
  return jsonText.slice(0, contentStart) + repaired + jsonText.slice(i)
}

export default async function transformStep(ctx: PipelineContext): Promise<void> {
  const { jobId, stringHitsByFile, enMessages, repoDir, stats } = ctx

  if (!geminiApiKey) {
    await log(jobId, {
      step: 'transform',
      level: 'warning',
      message:
        'GEMINI_API_KEY is not set; skipping automatic string wrapping and extraction.',
    })
    return
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey })

  let totalStrings = 0
  let filesModified = 0

  for (const [filePath, hits] of stringHitsByFile.entries()) {
    const relativePath = path.relative(repoDir, filePath)
    const code = await fs.promises.readFile(filePath, 'utf8')

    totalStrings += hits.length

    const systemPrompt =
      'You are a code transformation assistant that updates Next.js App Router React components to use next-intl translations.'

    const userPrompt = `
You are given a TypeScript/TSX or JavaScript/JSX file from a Next.js App Router project.

Your task:
- Add the appropriate import from 'next-intl':
  - For client components: "import { useTranslations } from 'next-intl';"
  - For server components: "import { getTranslations } from 'next-intl/server';"
- Introduce a translation helper:
  - Client: "const t = useTranslations('<namespace>');"
  - Server: "const t = await getTranslations('<namespace>');"
  - Use a simple namespace like "common" unless another is clearly better from context.
- Replace the listed hardcoded strings with calls to t('<key>').
  - Keys should be lowercase, dot-separated, and derived from the English string, e.g. "hero.title", "button.submit".
- Do NOT modify any code outside these string replacements and necessary imports/translation helper.

Return your response as strict JSON with this shape, and nothing else. CRITICAL REQUIREMENTS:
- Return ONLY valid JSON, no comments, no trailing commas, no extra text before or after the JSON object
- The "fileContent" value must be a single string with ALL newlines escaped as \\n (do not use literal newline characters inside the JSON string)
- Ensure proper JSON escaping: quotes inside strings must be escaped as \\"
- No trailing commas before } or ]

Expected JSON format:
{
  "fileContent": "<the full updated file text, with \\n for newlines>",
  "messages": {
    "common.keyOne": "Original text one",
    "common.keyTwo": "Original text two"
  }
}

File path: ${relativePath}

Original file contents:
----------------
${code}
----------------

Hardcoded string hits (line:column - text):
${hits
  .map(
    (hit) =>
      `- ${hit.line}:${hit.column} [${hit.type}${
        hit.attributeName ? `:${hit.attributeName}` : ''
      }] "${hit.value}"`,
  )
  .join('\n')}
`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: userPrompt }] }
      ]
      })

    const contentText = (response.text ?? '').trim()
    let jsonText = extractJson(contentText)

    let parsed: GeminiTransformResponse | null = null
    try {
      parsed = JSON.parse(jsonText) as GeminiTransformResponse
    } catch (firstErr) {
      // Try control character repair first
      const isControlChar =
        firstErr instanceof SyntaxError &&
        (/control character|Unexpected token/.test(firstErr.message) ||
          (firstErr.message.includes('position') && jsonText.includes('fileContent')))
      
      if (isControlChar) {
        try {
          const repairedJson = repairFileContentJson(jsonText)
          parsed = JSON.parse(repairedJson) as GeminiTransformResponse
        } catch (secondErr) {
          // Fall through to additional fallbacks
        }
      }

      // Additional fallbacks: extract JSON object and strip trailing commas
      if (!parsed) {
        try {
          let fallbackJson = extractJsonObject(jsonText)
          fallbackJson = stripTrailingCommas(fallbackJson)
          parsed = JSON.parse(fallbackJson) as GeminiTransformResponse
        } catch (thirdErr) {
          // Final attempt: combine all repairs
          try {
            let finalJson = extractJsonObject(jsonText)
            finalJson = stripTrailingCommas(finalJson)
            finalJson = repairFileContentJson(finalJson)
            parsed = JSON.parse(finalJson) as GeminiTransformResponse
          } catch (finalErr) {
            await log(jobId, {
              step: 'transform',
              level: 'warning',
              message: `Failed to parse Gemini response for ${relativePath} after multiple attempts. Skipping file.`,
              data: {
                error: finalErr instanceof Error ? finalErr.message : 'unknown error',
                jsonPreview: jsonText.slice(0, 200),
              },
            })
            continue
          }
        }
      }
    }

    if (!parsed) {
      await log(jobId, {
        step: 'transform',
        level: 'warning',
        message: `Failed to parse Gemini response for ${relativePath}. Skipping file.`,
      })
      continue
    }

    await fs.promises.writeFile(filePath, parsed.fileContent, 'utf8')
    filesModified += 1

    for (const [key, value] of Object.entries(parsed.messages)) {
      if (!enMessages[key]) {
        enMessages[key] = value
      }
    }

    await log(jobId, {
      step: 'transform',
      level: 'info',
      message: `Transformed ${filesModified}/${stringHitsByFile.size} files.`,
      data: {
        completedFiles: filesModified,
        totalFiles: stringHitsByFile.size,
        stringsExtracted: totalStrings,
      },
    })
  }

  // Write merged messages/en.json
  const messagesDir = path.join(repoDir, 'messages')
  const enMessagesPath = path.join(messagesDir, 'en.json')
  await fs.promises.mkdir(messagesDir, { recursive: true })
  await fs.promises.writeFile(
    enMessagesPath,
    JSON.stringify(enMessages, null, 2) + '\n',
    'utf8',
  )

  ctx.stats = {
    ...stats,
    stringsFound: stats.stringsFound + totalStrings,
    filesModified: stats.filesModified + filesModified,
  }

  await log(jobId, {
    step: 'transform',
    level: 'success',
    message: `Transformed ${filesModified} files and extracted ${totalStrings} translation keys.`,
    data: {
      completedFiles: filesModified,
      totalFiles: stringHitsByFile.size,
      stringsExtracted: totalStrings,
    },
  })
}

