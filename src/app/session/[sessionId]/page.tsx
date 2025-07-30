'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import SessionScreen from '@/components/SessionScreen'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const [isValidating, setIsValidating] = useState(true)
  const [validationError, setValidationError] = useState<string | null>(null)
  
  const sessionId = params.sessionId as string

  // Validate session exists and is active
  useEffect(() => {
    const validateSession = async () => {
      if (!sessionId) {
        setValidationError('セッションIDが無効です')
        setIsValidating(false)
        return
      }

      try {
        // Check if session exists on server
        const response = await fetch(`/api/realtime?sessionId=${sessionId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setValidationError('セッションが見つかりません。新しいセッションを開始してください。')
          } else {
            setValidationError('セッションの検証に失敗しました')
          }
          setIsValidating(false)
          return
        }

        // Session is valid
        setIsValidating(false)
      } catch (error) {
        console.error('Session validation error:', error)
        setValidationError('セッションの検証中にエラーが発生しました')
        setIsValidating(false)
      }
    }

    validateSession()
  }, [sessionId])

  // Handle session end
  const handleSessionEnd = () => {
    router.push('/')
  }

  // Show loading during validation
  if (isValidating) {
    return (
      <div className="min-h-screen gradient-primary flex items-center justify-center">
        <LoadingSpinner size="lg" message="セッションを確認中..." />
      </div>
    )
  }

  // Show error if validation failed
  if (validationError) {
    return (
      <div className="min-h-screen gradient-primary flex items-center justify-center tablet-padding">
        <div className="glass-card max-w-2xl w-full text-center tablet-padding">
          <div className="mb-6">
            <span className="text-6xl">⚠️</span>
          </div>
          
          <h2 className="text-tablet-2xl font-bold text-red-600 mb-4">
            セッションエラー
          </h2>
          
          <p className="text-tablet-lg text-gray-700 mb-8">
            {validationError}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/')}
              className="touch-target-lg px-8 py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
            >
              ホーム画面に戻る
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="touch-target-lg px-8 py-4 bg-gray-600 text-white rounded-2xl font-semibold hover:bg-gray-700 transition-colors"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render the session screen
  return (
    <div>
      <SessionScreen 
        sessionId={sessionId} 
        onSessionEnd={handleSessionEnd} 
      />
    </div>
  )
}