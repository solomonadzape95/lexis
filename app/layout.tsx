import './globals.css'
import type { ReactNode } from 'react'
import { ThemeWrapper } from '@/components/ThemeWrapper'
import { JobRealtimeProvider } from '@/components/JobRealtimeProvider'

export const metadata = {
  title: 'Lexis - i18n Agent',
  description: 'Globalize any Next.js repo with one click',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-mono antialiased transition-colors duration-300 overflow-x-hidden">
        <ThemeWrapper>
          <JobRealtimeProvider>{children}</JobRealtimeProvider>
        </ThemeWrapper>
      </body>
    </html>
  )
}

