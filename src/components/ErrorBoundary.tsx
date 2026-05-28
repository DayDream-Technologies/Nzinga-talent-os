import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-screen flex-col items-center justify-center gap-4 bg-page-bg p-8">
            <h1 className="text-lg font-bold text-t1">Something went wrong</h1>
            <p className="max-w-md text-center text-sm text-t3">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Reload app
            </Button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
