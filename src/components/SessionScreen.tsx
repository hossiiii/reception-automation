'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRealtimeSession } from '@/hooks/useRealtimeSession'
import LoadingSpinner, { VoiceActivityIndicator, ConnectionStatus } from './LoadingSpinner'
import type { SessionScreenProps } from '@/types/session'

export default function SessionScreen({ sessionId, onSessionEnd }: SessionScreenProps) {
  const router = useRouter()
  const [showTranscript, setShowTranscript] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  
  const {
    isConnected,
    isLoading,
    error,
    conversations,
    endSession,
    audioLevel = 0,
    isRecording = false,
    isSpeaking = false
  } = useRealtimeSession({
    sessionId,
    onSessionEnd: () => {
      if (onSessionEnd) {
        onSessionEnd()
      } else {
        router.push('/')
      }
    }
  })

  // Handle session termination
  const handleEndSession = async () => {
    setIsEnding(true)
    try {
      await endSession()
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }

  // Get connection status
  const getConnectionStatus = () => {
    if (error) return 'error'
    if (isLoading) return 'connecting'
    if (isConnected) return 'connected'
    return 'disconnected'
  }

  // Auto-scroll transcript to bottom when new messages arrive
  useEffect(() => {
    if (showTranscript && conversations.length > 0) {
      const transcriptElement = document.getElementById('transcript-container')
      if (transcriptElement) {
        transcriptElement.scrollTop = transcriptElement.scrollHeight
      }
    }
  }, [conversations, showTranscript])

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-primary flex items-center justify-center">
        <LoadingSpinner size="lg" message="音声接続を初期化中..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-primary flex items-center justify-center tablet-padding">
        <div className="glass-card max-w-2xl w-full text-center tablet-padding">
          <h2 className="text-tablet-2xl font-bold text-red-600 mb-4">
            接続エラー
          </h2>
          <p className="text-tablet-lg text-gray-700 mb-8">
            {error}
          </p>
          <button
            onClick={() => router.push('/')}
            className="touch-target-lg px-8 py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
          >
            ホーム画面に戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-primary">
      {/* Header with connection status */}
      <div className="flex justify-between items-center p-6 border-b border-white/20">
        <ConnectionStatus status={getConnectionStatus()} size="md" />
        
        <div className="flex gap-4">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="touch-target px-4 py-2 glass-effect rounded-xl text-tablet-base font-medium hover:bg-white/20 transition-colors"
          >
            {showTranscript ? '会話を隠す' : '会話を表示'}
          </button>
          
          <button
            onClick={handleEndSession}
            disabled={isEnding}
            className="touch-target-lg px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isEnding ? '終了中...' : '会話終了'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Main conversation area */}
        <div className="flex-1 flex flex-col items-center justify-center tablet-padding">
          {/* Voice activity indicator */}
          <div className="mb-8">
            <VoiceActivityIndicator 
              level={audioLevel}
              isActive={isRecording || isSpeaking}
              size="lg"
            />
          </div>

          {/* Status messages */}
          <div className="text-center mb-8">
            {isSpeaking && (
              <p className="text-tablet-xl font-semibold text-blue-600 animate-pulse">
                🤖 AIが話しています...
              </p>
            )}
            {isRecording && !isSpeaking && (
              <p className="text-tablet-xl font-semibold text-green-600">
                🎤 音声を認識中...
              </p>
            )}
            {!isRecording && !isSpeaking && isConnected && (
              <p className="text-tablet-lg text-gray-600">
                話しかけてください
              </p>
            )}
          </div>

          {/* Instructions */}
          <div className="glass-card max-w-2xl text-center tablet-padding">
            <h3 className="text-tablet-lg font-semibold mb-4">
              使用方法
            </h3>
            <ul className="text-tablet-base text-gray-700 space-y-2 text-left">
              <li>• マイクに向かって自然に話しかけてください</li>
              <li>• AIが自動的に応答します</li>
              <li>• 会話が終わったら「会話終了」ボタンを押してください</li>
              <li>• 会話履歴は自動的にSlackに送信されます</li>
            </ul>
          </div>
        </div>

        {/* Transcript sidebar */}
        {showTranscript && (
          <div className="lg:w-96 border-l border-white/20 bg-white/5 backdrop-blur-sm">
            <div className="p-6">
              <h3 className="text-tablet-lg font-semibold mb-4">
                会話履歴
              </h3>
              
              <div 
                id="transcript-container"
                className="space-y-4 max-h-96 lg:max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar"
              >
                {conversations.length === 0 ? (
                  <p className="text-gray-500">まだ会話がありません</p>
                ) : (
                  conversations.map((conv, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg ${
                        conv.role === 'user' 
                          ? 'bg-blue-100 ml-4' 
                          : 'bg-gray-100 mr-4'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {conv.role === 'user' ? '👤 来訪者' : '🤖 AI'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(conv.timestamp).toLocaleTimeString('ja-JP')}
                        </span>
                      </div>
                      <p className="text-tablet-sm">{conv.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audio level indicator (bottom bar) */}
      {isConnected && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm border-t border-white/20">
          <div className="flex items-center justify-center p-4">
            <div className="flex items-center gap-4">
              <span className="text-tablet-sm text-white/80">音声レベル:</span>
              <div className="w-32 h-2 bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-100"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
              <span className="text-tablet-sm text-white/80 w-12">
                {Math.round(audioLevel * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Emergency exit button (always visible) */}
      <button
        onClick={() => router.push('/')}
        className="fixed top-4 left-4 touch-target-lg p-3 bg-gray-600/80 text-white rounded-full hover:bg-gray-700/80 transition-colors z-50"
        title="ホーム画面に戻る"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
    </div>
  )
}