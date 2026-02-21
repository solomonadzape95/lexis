/**
 * Call Gemini with the same JSON shape the transform step uses (minimal prompt)
 * and print the raw response so we can see format / control characters.
 *
 * Run: node --env-file=.env scripts/inspect-gemini-response.mjs
 * Or:  GEMINI_API_KEY=yourkey node scripts/inspect-gemini-response.mjs
 */

import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { GoogleGenAI } from '@google/genai'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Load .env if present
if (existsSync(join(root, '.env'))) {
  const env = readFileSync(join(root, '.env'), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
}

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.error('GEMINI_API_KEY not set. Use .env or GEMINI_API_KEY=...')
  process.exit(1)
}

const userPrompt = `
You are given a TypeScript/TSX or JavaScript/JSX file from a Next.js App Router project.

Your task:
- Add the appropriate import from 'next-intl'.
- Introduce a translation helper and replace the listed hardcoded strings with calls to t('<key>').
- Return your response as strict JSON with this shape, and nothing else:
{
  "fileContent": "<the full updated file text>",
  "messages": {
    "common.keyOne": "Original text one"
  }
}

File path: app/layout.tsx

Original file contents:
----------------
export default function RootLayout({ children }) {
  return <html><body>{children}</body></html>;
}
----------------

Hardcoded string hits (line:column - text):
- 2:45 [JSXText] "Hello"
`

async function main() {
  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
  })

  const raw = (response.text ?? '').trim()
  console.log('=== Raw response length:', raw.length)
  console.log('=== First 500 chars (repr):')
  console.log(JSON.stringify(raw.slice(0, 500)))
  console.log('\n=== Full raw (so we see control chars / newlines):')
  console.log(JSON.stringify(raw))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
