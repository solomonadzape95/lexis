import fs from 'node:fs'
import path from 'node:path'
import type { PipelineContext } from '../types'
import { log } from '../logger'

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true })
}

async function writeJson(filePath: string, data: unknown) {
  await ensureDir(path.dirname(filePath))
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

export default async function setupI18nStep(ctx: PipelineContext): Promise<void> {
  const { repoDir, targetLanguages, jobId, frameworkAdapter } = ctx

  // Use framework adapter if available, otherwise fall back to default Next.js setup
  if (frameworkAdapter) {
    await frameworkAdapter.setupI18n(ctx)
    return
  }

  // Fallback to original Next.js App Router setup

  const i18nConfigPath = path.join(repoDir, 'i18n.json')
  const messagesDir = path.join(repoDir, 'messages')
  const enMessagesPath = path.join(messagesDir, 'en.json')

  // 1. i18n.json
  const i18nConfig = {
    $schema: 'https://lingo.dev/schema/i18n.json',
    version: '1.10',
    locale: {
      source: 'en',
      targets: targetLanguages,
    },
    buckets: {
      json: {
        include: ['messages/[locale].json'],
      },
    },
  }

  await writeJson(i18nConfigPath, i18nConfig)

  // 2. messages/en.json (empty for now)
  if (!(await fileExists(enMessagesPath))) {
    await writeJson(enMessagesPath, {})
  }

  // 3. next-intl plumbing (minimal implementation)
  const libDir = path.join(repoDir, 'lib')
  const i18nLibPath = path.join(libDir, 'i18n.ts')
  await ensureDir(libDir)

  const i18nTs = `import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', ${targetLanguages.map((lng) => `'${lng}'`).join(', ')}] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({locale}) => ({
  messages: (await import(\`../messages/\${locale}.json\`)).default
}));
`

  await fs.promises.writeFile(i18nLibPath, i18nTs, 'utf8')

  // 4. middleware.ts
  const middlewarePath = path.join(repoDir, 'middleware.ts')
  const middlewareTs = `import createMiddleware from 'next-intl/middleware';
import { locales } from './lib/i18n';

export default createMiddleware({
  locales,
  defaultLocale: 'en'
});

export const config = {
  matcher: ['/((?!_next|.*\\\\..*).*)']
};
`

  await fs.promises.writeFile(middlewarePath, middlewareTs, 'utf8')

  // 5. next.config.ts - wrap with withNextIntl
  const nextConfigPath = path.join(repoDir, 'next.config.ts')
  const nextConfigTs = `import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const config: NextConfig = {
  reactStrictMode: true
};

export default withNextIntl(config);
`
  await fs.promises.writeFile(nextConfigPath, nextConfigTs, 'utf8')

  // 6 & 7. app/[locale]/layout.tsx and app/[locale]/page.tsx
  const appDir = path.join(repoDir, 'app')
  const layoutPath = path.join(appDir, 'layout.tsx')
  const pagePath = path.join(appDir, 'page.tsx')
  const localeDir = path.join(appDir, '[locale]')

  await ensureDir(localeDir)

  if (await fileExists(layoutPath)) {
    const original = await fs.promises.readFile(layoutPath, 'utf8')
    const newLayoutPath = path.join(localeDir, 'layout.tsx')
    await fs.promises.writeFile(newLayoutPath, original, 'utf8')
    await fs.promises.rm(layoutPath)
  }

  if (await fileExists(pagePath)) {
    const original = await fs.promises.readFile(pagePath, 'utf8')
    const newPagePath = path.join(localeDir, 'page.tsx')
    await fs.promises.writeFile(newPagePath, original, 'utf8')
    await fs.promises.rm(pagePath)
  }

  const localesAdded = ['en', ...targetLanguages]
  await log(jobId, {
    step: 'setup-i18n',
    level: 'info',
    message: 'i18n infrastructure scaffolded (i18n.json, messages/en.json, next-intl config).',
    data: { localesAdded },
  })
}

