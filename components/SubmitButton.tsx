'use client'

import { useFormStatus } from 'react-dom'
import Loader from './Loader'

type Props = {
  children: React.ReactNode
  className?: string
}

export default function SubmitButton({ children, className }: Props) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
    >
      {pending ? (
        <>
          <Loader size="sm" className="mr-2" />
          Starting…
        </>
      ) : (
        children
      )}
    </button>
  )
}
