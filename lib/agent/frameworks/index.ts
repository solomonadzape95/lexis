import type { PipelineContext } from '../types'
import type { TransformRule } from '@/lib/transform-rules'
import { nextjsAppRouterAdapter } from './nextjs-app-router'

export type FrameworkAdapter = {
  name: string
  validate: (repoDir: string) => Promise<void>
  setupI18n: (ctx: PipelineContext) => Promise<void>
  getSourceDirs: () => string[]
  getFilePatterns: () => string[]
  getTransformRules: () => TransformRule[]
}

export const frameworkAdapters: Record<string, FrameworkAdapter> = {
  'nextjs-app-router': nextjsAppRouterAdapter,
  // Future adapters:
  // 'nextjs-pages-router': nextjsPagesRouterAdapter,
  // 'react-vite': reactViteAdapter,
  // 'react-cra': reactCRAAdapter,
}

export function getAdapter(frameworkType: string): FrameworkAdapter | null {
  return frameworkAdapters[frameworkType] ?? null
}
