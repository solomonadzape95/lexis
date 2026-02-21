import fs from 'node:fs'
import path from 'node:path'
import type { PipelineContext } from '../types'
import type { TransformRule } from '@/lib/transform-rules'
import { log } from '../logger'

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true })
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function writeJson(filePath: string, data: unknown) {
  await ensureDir(path.dirname(filePath))
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

export const nextjsAppRouterAdapter = {
  name: 'Next.js App Router',
  
  async validate(repoDir: string): Promise<void> {
    const appDir = path.join(repoDir, 'app')
    const packageJsonPath = path.join(repoDir, 'package.json')

    const hasAppDir = await fileExists(appDir)
    const hasPackageJson = await fileExists(packageJsonPath)

    if (!hasAppDir || !hasPackageJson) {
      throw new Error('Currently supports Next.js App Router projects only.')
    }

    const pkgRaw = await fs.promises.readFile(packageJsonPath, 'utf8')
    const pkg = JSON.parse(pkgRaw) as { dependencies?: Record<string, string> }

    if (!pkg.dependencies || !pkg.dependencies.next) {
      throw new Error('No Next.js dependency found in package.json.')
    }
  },

  async setupI18n(ctx: PipelineContext): Promise<void> {
    const { repoDir, targetLanguages, jobId } = ctx

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

    // 3. next-intl plumbing
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
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
`

    await fs.promises.writeFile(middlewarePath, middlewareTs, 'utf8')

    // 5. Update app/layout.tsx to use next-intl
    const appLayoutPath = path.join(repoDir, 'app', 'layout.tsx')
    if (await fileExists(appLayoutPath)) {
      let layoutContent = await fs.promises.readFile(appLayoutPath, 'utf8')
      
      // Add import if not present
      if (!layoutContent.includes("next-intl")) {
        layoutContent = `import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
${layoutContent}`
      }
      
      // Wrap children with NextIntlClientProvider if not already wrapped
      if (!layoutContent.includes('NextIntlClientProvider')) {
        layoutContent = layoutContent.replace(
          /export default async function RootLayout/g,
          `export default async function RootLayout`,
        )
        layoutContent = layoutContent.replace(
          /<body([^>]*)>/,
          `<body$1>
        <NextIntlClientProvider messages={await getMessages()}>`,
        )
        layoutContent = layoutContent.replace(
          /<\/body>/,
          `</NextIntlClientProvider>
      </body>`,
        )
      }
      
      await fs.promises.writeFile(appLayoutPath, layoutContent, 'utf8')
    }

    await log(jobId, {
      step: 'setup-i18n',
      level: 'success',
      message: `Set up i18n infrastructure for Next.js App Router with ${targetLanguages.length} target languages`,
    })
  },

  getSourceDirs(): string[] {
    return ['app', 'components']
  },

  getFilePatterns(): string[] {
    return ['**/*.{tsx,ts,jsx,js}']
  },

  getTransformRules(): TransformRule[] {
    // Return basic transform rules for Next.js App Router
    // These would be imported from a shared transform rules file
    return [
      {
        pattern: /(["'])([^"']+)\1/g,
        transform: (match: string) => `t('${match}')`,
      },
    ]
  },
}
