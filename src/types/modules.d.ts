declare module 'sonner' {
  import type { ReactNode } from 'react'
  interface Toast {
    (message: string | ReactNode, options?: object): void
    success: (message: string | ReactNode, options?: object) => void
    error: (message: string | ReactNode, options?: object) => void
    loading: (message: string | ReactNode, options?: object) => void
    promise: <T>(p: Promise<T>, opts: { loading?: string; success?: string; error?: string }) => void
  }
  export const toast: Toast
  export function Toaster(props?: object): ReactNode
}

declare module 'react-hot-toast' {
  import type { ReactNode } from 'react'
  interface Toast {
    (message: string | ReactNode, options?: object): string
    success: (message: string | ReactNode, options?: object) => string
    error: (message: string | ReactNode, options?: object) => string
    loading: (message: string | ReactNode, options?: object) => string
  }
  const toast: Toast
  export default toast
}
