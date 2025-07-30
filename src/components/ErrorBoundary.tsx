'use client'

import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Send error to monitoring service if configured
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // You could add error reporting here (e.g., Sentry)
      console.error('Production error:', { error, errorInfo })
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center tablet-padding">
      <div className="glass-card max-w-2xl w-full text-center tablet-padding">
        <div className="mb-6">
          <span className="text-6xl">😵</span>
        </div>
        
        <h2 className="text-tablet-2xl font-bold text-red-600 mb-4">
          予期しないエラーが発生しました
        </h2>
        
        <p className="text-tablet-lg text-gray-700 mb-6">
          アプリケーションで問題が発生しました。申し訳ございません。
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-tablet-base font-semibold text-gray-600 mb-2">
              エラーの詳細 (開発モード)
            </summary>
            <div className="bg-gray-100 p-4 rounded-lg text-tablet-sm font-mono text-gray-800">
              <p className="font-semibold mb-2">Error: {error.message}</p>
              <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                {error.stack}
              </pre>
            </div>
          </details>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={resetError}
            className="touch-target-lg px-8 py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
          >
            再試行
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="touch-target-lg px-8 py-4 bg-gray-600 text-white rounded-2xl font-semibold hover:bg-gray-700 transition-colors"
          >
            ホーム画面に戻る
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for handling async errors in function components
export function useErrorHandler() {
  return React.useCallback((error: Error) => {
    console.error('Async error:', error)
    // In a real app, you might want to show a toast notification
    // or use a global error state management
    throw error
  }, [])
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default ErrorBoundary