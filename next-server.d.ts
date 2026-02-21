// Type declarations for Next.js modules
// These help TypeScript resolve Next.js modules when module resolution has issues

declare module 'next/server' {
  export interface NextRequest extends Request {
    readonly cookies: any
    readonly nextUrl: URL
  }
  export class NextResponse extends Response {
    static json(body: any, init?: ResponseInit): NextResponse
    static redirect(url: string | URL, status?: number): NextResponse
    static rewrite(destination: string | URL, init?: ResponseInit): NextResponse
    static next(init?: ResponseInit & { request?: { headers?: Headers } }): NextResponse
    cookies: any
  }
}

declare module 'next/server.js' {
  export * from 'next/server'
}

declare module 'next/navigation' {
  export function notFound(): never
  export function redirect(url: string | URL): never
  export function permanentRedirect(url: string | URL): never
  export function useRouter(): any
  export function usePathname(): string
  export function useSearchParams(): URLSearchParams
}

declare module 'next/navigation.js' {
  export * from 'next/navigation'
}

declare module 'next/link' {
  import { ComponentProps } from 'react'
  export default function Link(props: ComponentProps<'a'> & { href: string }): JSX.Element
}

declare module 'next/link.js' {
  export * from 'next/link'
}

declare module 'next/headers' {
  export function cookies(): {
    get(name: string): { name: string; value: string } | undefined
    getAll(): Array<{ name: string; value: string }>
    set(name: string, value: string, options?: any): void
    has(name: string): boolean
    delete(name: string): void
  }
  export function headers(): Headers
  export function draftMode(): { isEnabled: boolean; enable(): void; disable(): void }
}

declare module 'next/headers.js' {
  export * from 'next/headers'
}

declare module 'react-dom' {
  export function useFormStatus(): {
    pending: boolean
    data: FormData | null
    method: string
    action: string | ((formData: FormData) => void) | null
  }
}

declare module 'next/dist/lib/metadata/types/metadata-interface.js' {
  export type ResolvingMetadata = Record<string, unknown>
  export type ResolvingViewport = Record<string, unknown>
}
