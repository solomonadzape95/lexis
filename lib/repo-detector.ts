import { Octokit } from '@octokit/rest'

export type DetectedFramework = {
  name: string
  version?: string
  type?: string // e.g., 'app-router', 'pages-router', 'nuxt3', 'vite'
  supported: boolean
  supportLevel: 'full' | 'coming-soon' | 'not-supported'
  icon?: string
}

export type FrameworkSupport = {
  framework: DetectedFramework
  canProceed: boolean
  message?: string
}

const FRAMEWORK_DETECTORS: Array<{
  name: string
  detect: (pkg: Record<string, unknown>, repoStructure: { hasAppDir: boolean; hasPagesDir: boolean; hasSrcDir: boolean }) => DetectedFramework | null
}> = [
  {
    name: 'Next.js',
    detect: (pkg, structure) => {
      const deps = { ...(pkg.dependencies as Record<string, string>), ...(pkg.devDependencies as Record<string, string>) }
      if (!deps.next) return null

      const version = deps.next
      const isAppRouter = structure.hasAppDir
      const isPagesRouter = structure.hasPagesDir && !structure.hasAppDir

      return {
        name: 'Next.js',
        version,
        type: isAppRouter ? 'app-router' : isPagesRouter ? 'pages-router' : 'unknown',
        supported: isAppRouter,
        supportLevel: isAppRouter ? 'full' : 'coming-soon',
        icon: 'nextjs',
      }
    },
  },
  {
    name: 'React',
    detect: (pkg, structure) => {
      const deps = { ...(pkg.dependencies as Record<string, string>), ...(pkg.devDependencies as Record<string, string>) }
      if (!deps.react) return null
      // Don't list React separately when it's a Next.js app — Next.js (app-router) already implies React
      if (deps.next && structure.hasAppDir) return null

      const hasVite = deps.vite || deps['@vitejs/plugin-react']
      const hasCRA = deps['react-scripts']
      const hasRemix = deps['@remix-run/react']

      if (hasRemix) {
        return {
          name: 'Remix',
          version: deps['@remix-run/react'],
          type: 'remix',
          supported: false,
          supportLevel: 'coming-soon',
        }
      }

      if (hasVite) {
        return {
          name: 'React + Vite',
          version: deps.react,
          type: 'vite',
          supported: false,
          supportLevel: 'coming-soon',
        }
      }

      if (hasCRA) {
        return {
          name: 'React (CRA)',
          version: deps.react,
          type: 'cra',
          supported: false,
          supportLevel: 'coming-soon',
        }
      }

      return {
        name: 'React',
        version: deps.react,
        type: 'unknown',
        supported: false,
        supportLevel: 'not-supported',
      }
    },
  },
  {
    name: 'Vue',
    detect: (pkg, structure) => {
      const deps = { ...(pkg.dependencies as Record<string, string>), ...(pkg.devDependencies as Record<string, string>) }
      if (!deps.vue && !deps.nuxt) return null

      if (deps.nuxt) {
        return {
          name: 'Nuxt',
          version: deps.nuxt,
          type: 'nuxt3',
          supported: false,
          supportLevel: 'coming-soon',
        }
      }

      return {
        name: 'Vue',
        version: deps.vue,
        type: 'vue',
        supported: false,
        supportLevel: 'coming-soon',
      }
    },
  },
  {
    name: 'Angular',
    detect: (pkg) => {
      const deps = { ...(pkg.dependencies as Record<string, string>), ...(pkg.devDependencies as Record<string, string>) }
      if (!deps['@angular/core']) return null

      return {
        name: 'Angular',
        version: deps['@angular/core'],
        type: 'angular',
        supported: false,
        supportLevel: 'coming-soon',
      }
    },
  },
  {
    name: 'Svelte',
    detect: (pkg) => {
      const deps = { ...(pkg.dependencies as Record<string, string>), ...(pkg.devDependencies as Record<string, string>) }
      if (!deps.svelte && !deps['@sveltejs/kit']) return null

      if (deps['@sveltejs/kit']) {
        return {
          name: 'SvelteKit',
          version: deps['@sveltejs/kit'],
          type: 'sveltekit',
          supported: false,
          supportLevel: 'coming-soon',
        }
      }

      return {
        name: 'Svelte',
        version: deps.svelte,
        type: 'svelte',
        supported: false,
        supportLevel: 'coming-soon',
      }
    },
  },
  {
    name: 'Astro',
    detect: (pkg) => {
      const deps = { ...(pkg.dependencies as Record<string, string>), ...(pkg.devDependencies as Record<string, string>) }
      if (!deps.astro) return null

      return {
        name: 'Astro',
        version: deps.astro,
        type: 'astro',
        supported: false,
        supportLevel: 'coming-soon',
      }
    },
  },
]

export async function detectFrameworks(
  owner: string,
  repo: string,
  token: string,
): Promise<DetectedFramework[]> {
  const octokit = new Octokit({ auth: token || undefined })

  try {
    // Get package.json content
    const { data: pkgFile } = await octokit.repos.getContent({
      owner,
      repo,
      path: 'package.json',
    })

    if (!('content' in pkgFile) || !pkgFile.content) {
      return []
    }

    const pkgContent = Buffer.from(pkgFile.content, 'base64').toString('utf-8')
    const pkg = JSON.parse(pkgContent) as Record<string, unknown>

    // Check repository structure
    const { data: rootContents } = await octokit.repos.getContent({
      owner,
      repo,
      path: '',
    })

    const contents = Array.isArray(rootContents) ? rootContents : []
    const hasAppDir = contents.some((item) => item.type === 'dir' && item.name === 'app')
    const hasPagesDir = contents.some((item) => item.type === 'dir' && item.name === 'pages')
    const hasSrcDir = contents.some((item) => item.type === 'dir' && item.name === 'src')

    const repoStructure = { hasAppDir, hasPagesDir, hasSrcDir }

    // Run all detectors
    const frameworks: DetectedFramework[] = []
    for (const detector of FRAMEWORK_DETECTORS) {
      const detected = detector.detect(pkg, repoStructure)
      if (detected) {
        frameworks.push(detected)
      }
    }

    return frameworks
  } catch (error) {
    console.error('Failed to detect frameworks:', error)
    return []
  }
}

export function getFrameworkSupport(framework: DetectedFramework): FrameworkSupport {
  if (framework.supportLevel === 'full') {
    return {
      framework,
      canProceed: true,
    }
  }

  if (framework.supportLevel === 'coming-soon') {
    return {
      framework,
      canProceed: false,
      message: `${framework.name} support is coming soon! Currently only Next.js App Router is supported.`,
    }
  }

  return {
    framework,
    canProceed: false,
    message: `${framework.name} is not currently supported. Only Next.js App Router projects are supported.`,
  }
}
