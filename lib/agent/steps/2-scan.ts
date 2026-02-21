import fs from 'node:fs'
import path from 'node:path'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import type { File } from '@babel/types'
import type { PipelineContext } from '../types'
import { log } from '../logger'
import type { StringHit } from '../../../types'

const DEFAULT_SOURCE_DIRS = ['app', 'components']
const EXTENSIONS = new Set(['.tsx', '.ts', '.jsx', '.js'])

async function collectFiles(root: string, dirs: string[]): Promise<string[]> {
  const files: string[] = []

  async function walk(current: string) {
    const entries = await fs.promises.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.isFile()) {
        if (EXTENSIONS.has(path.extname(entry.name))) {
          files.push(fullPath)
        }
      }
    }
  }

  for (const dir of dirs) {
    const dirPath = path.join(root, dir)
    try {
      const stat = await fs.promises.stat(dirPath)
      if (stat.isDirectory()) {
        await walk(dirPath)
      }
    } catch {
      // ignore missing directories
    }
  }

  return files
}

function isInsideTranslationCall(pathNode: any): boolean {
  // Rough heuristic: see if any ancestor is CallExpression with callee named "t"
  let current = pathNode.parentPath
  while (current) {
    if (
      current.node.type === 'CallExpression' &&
      current.node.callee.type === 'Identifier' &&
      current.node.callee.name === 't'
    ) {
      return true
    }
    current = current.parentPath
  }
  return false
}

export default async function scanStep(ctx: PipelineContext): Promise<void> {
  const { repoDir, jobId, stringHitsByFile, frameworkAdapter } = ctx

  const sourceDirs = frameworkAdapter?.getSourceDirs() ?? DEFAULT_SOURCE_DIRS
  const sourceFiles = await collectFiles(repoDir, sourceDirs)
  let totalStrings = 0

  for (const filePath of sourceFiles) {
    const code = await fs.promises.readFile(filePath, 'utf8')

    let ast: File
    try {
      ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      })
    } catch {
      // Skip files that fail to parse
      continue
    }

    const hits: StringHit[] = []

    traverse(ast, {
      JSXText(pathNode) {
        if (isInsideTranslationCall(pathNode)) return

        const raw = pathNode.node.value
        const value = raw.trim()
        if (!value || value.length === 1 || /^[0-9\s]+$/.test(value)) return

        hits.push({
          value,
          line: pathNode.node.loc?.start.line ?? 0,
          column: pathNode.node.loc?.start.column ?? 0,
          type: 'JSXText',
        })
      },
      JSXAttribute(pathNode) {
        if (isInsideTranslationCall(pathNode)) return

        const attributeName =
          pathNode.node.name.type === 'JSXIdentifier'
            ? pathNode.node.name.name
            : undefined

        if (!attributeName) return

        const allowedAttributes = new Set([
          'alt',
          'placeholder',
          'title',
          'aria-label',
        ])

        if (!allowedAttributes.has(attributeName)) return

        const valueNode = pathNode.node.value
        if (!valueNode || valueNode.type !== 'StringLiteral') return

        const raw = valueNode.value
        const value = raw.trim()
        if (!value || value.length === 1 || /^[0-9\s]+$/.test(value)) return

        hits.push({
          value,
          line: valueNode.loc?.start.line ?? 0,
          column: valueNode.loc?.start.column ?? 0,
          type: 'JSXAttribute',
          attributeName,
        })
      },
      StringLiteral(pathNode) {
        if (isInsideTranslationCall(pathNode)) return

        const value = pathNode.node.value.trim()
        if (!value || value.length === 1 || /^[0-9\s]+$/.test(value)) return

        hits.push({
          value,
          line: pathNode.node.loc?.start.line ?? 0,
          column: pathNode.node.loc?.start.column ?? 0,
          type: 'StringLiteral',
        })
      },
    })

    if (hits.length > 0) {
      stringHitsByFile.set(filePath, hits)
      totalStrings += hits.length
    }
  }

  await log(jobId, {
    step: 'scan',
    level: 'info',
    message: `Found ${totalStrings} hardcoded strings across ${stringHitsByFile.size} files.`,
    data: { filesWithStrings: stringHitsByFile.size, totalStrings },
  })
}

