'use client'

import {
  SiNextdotjs,
  SiReact,
  SiVuedotjs,
  SiNuxtdotjs,
  SiSvelte,
  SiAngular,
  SiRemix,
  SiAstro,
} from 'react-icons/si'
import { HiCode } from 'react-icons/hi'

type Props = {
  name: string
  type?: string
  className?: string
  size?: number
}

/**
 * Renders the framework logo using react-icons (Simple Icons).
 * Used in repo structure scan.
 */
export default function FrameworkIcon({ name, className = '', size = 24 }: Props) {
  const props = { size, className: `shrink-0 ${className}` }

  if (name === 'Next.js') return <SiNextdotjs {...props} />
  if (name === 'React' || name === 'React + Vite' || name === 'React (CRA)') return <SiReact {...props} />
  if (name === 'Vue') return <SiVuedotjs {...props} />
  if (name === 'Nuxt') return <SiNuxtdotjs {...props} />
  if (name === 'Svelte' || name === 'SvelteKit') return <SiSvelte {...props} />
  if (name === 'Angular') return <SiAngular {...props} />
  if (name === 'Remix') return <SiRemix {...props} />
  if (name === 'Astro') return <SiAstro {...props} />

  return <HiCode {...props} />
}
