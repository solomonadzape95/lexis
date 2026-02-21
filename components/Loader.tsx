'use client'

type LoaderProps = {
  size?: 'default' | 'sm'
  className?: string
}

export default function Loader({ size = 'default', className = '' }: LoaderProps) {
  const sizeClass = size === 'sm' ? 'loader loader-sm' : 'loader'
  return <div className={`${sizeClass} ${className}`} aria-hidden />
}

