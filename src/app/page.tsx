'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function HomePage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAppointmentClick = async (hasAppointment: boolean) => {
    setIsConnecting(true)
    setError(null)
    
    try {
      // Create session with appropriate role
      const response = await fetch('/api/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role: hasAppointment ? 'visitor' : 'sales_rejection',
          sessionId: crypto.randomUUID()
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create session')
      }
      
      const data = await response.json()
      
      // Navigate to session screen
      router.push(`/session/${data.sessionId}`)
    } catch (error) {
      console.error('Session creation error:', error)
      setError(error instanceof Error ? error.message : 'セッションの作成に失敗しました')
      setIsConnecting(false)
    }
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen gradient-primary flex items-center justify-center">
        <LoadingSpinner size="lg" message="セッションを作成中..." />
      </div>
    )
  }

  return (
    <main className="min-h-screen gradient-primary flex items-center justify-center tablet-padding">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6">
            ようこそ
          </h1>
          <p className="text-tablet-lg text-gray-600 mb-2">
            受付AIアシスタントです
          </p>
          <p className="text-tablet-base text-gray-500">
            該当するボタンをタッチしてください
          </p>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="glass-card bg-red-50 border-red-200 max-w-2xl mx-auto mb-8 tablet-padding">
            <div className="flex items-center gap-3">
              <span className="text-red-500 text-2xl">⚠️</span>
              <div>
                <h3 className="text-tablet-base font-semibold text-red-800">
                  エラーが発生しました
                </h3>
                <p className="text-tablet-sm text-red-600">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-4 touch-target px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              閉じる
            </button>
          </div>
        )}
        
        {/* Main buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Appointment button */}
          <button
            onClick={() => handleAppointmentClick(true)}
            disabled={isConnecting}
            className="group relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-sm shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed touch-target-xl tablet-padding"
          >
            {/* Hover gradient overlay */}
            <div className="absolute inset-0 gradient-success opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
            
            <div className="relative z-10 text-center">
              {/* Icon */}
              <div className="mb-6 mx-auto w-24 h-24 md:w-28 md:h-28 gradient-success rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 md:w-14 md:h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              {/* Text */}
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                アポイントを
              </h2>
              <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent mb-4">
                お取りの方はこちら
              </p>
              <p className="text-tablet-sm text-gray-600">
                予約済みの方・お約束のある方
              </p>
            </div>
          </button>

          {/* No appointment button */}
          <button
            onClick={() => handleAppointmentClick(false)}
            disabled={isConnecting}
            className="group relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-sm shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed touch-target-xl tablet-padding"
          >
            {/* Hover gradient overlay */}
            <div className="absolute inset-0 gradient-warning opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
            
            <div className="relative z-10 text-center">
              {/* Icon */}
              <div className="mb-6 mx-auto w-24 h-24 md:w-28 md:h-28 gradient-warning rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 md:w-14 md:h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              
              {/* Text */}
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                アポイントを
              </h2>
              <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent mb-4">
                お取りでない方はこちら
              </p>
              <p className="text-tablet-sm text-gray-600">
                営業・飛び込み訪問の方
              </p>
            </div>
          </button>
        </div>
        
        {/* Footer information */}
        <div className="mt-12 text-center">
          <div className="glass-card max-w-3xl mx-auto tablet-padding">
            <h3 className="text-tablet-lg font-semibold mb-4">
              ご利用方法
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-tablet-base text-gray-700">
              <div>
                <h4 className="font-semibold text-green-600 mb-2">✅ アポイント有りの方</h4>
                <ul className="text-left space-y-1">
                  <li>• ご予約済みの方</li>
                  <li>• お約束のある方</li>
                  <li>• 事前連絡済みの方</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-orange-600 mb-2">🚫 アポイント無しの方</h4>
                <ul className="text-left space-y-1">
                  <li>• 飛び込み営業の方</li>
                  <li>• 事前連絡のない方</li>
                  <li>• 商品紹介の方</li>
                </ul>
              </div>
            </div>
            <p className="text-tablet-sm text-gray-500 mt-4">
              音声でお話しいただけます。マイクの使用を許可してください。
            </p>
          </div>
        </div>

        {/* Version info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Reception Automation v1.0 | Powered by OpenAI Realtime API
          </p>
        </div>
      </div>
    </main>
  )
}