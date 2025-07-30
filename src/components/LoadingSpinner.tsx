'use client'

import type { LoadingSpinnerProps } from '@/types/session'

export default function LoadingSpinner({ 
  size = 'md', 
  message = '接続中...' 
}: LoadingSpinnerProps) {
  // Size configurations optimized for tablet viewing
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }
  
  const textSizeClasses = {
    sm: 'text-tablet-sm',
    md: 'text-tablet-base',
    lg: 'text-tablet-lg'
  }
  
  const containerPadding = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${containerPadding[size]}`}>
      {/* Animated spinner */}
      <div className="relative">
        {/* Outer ring */}
        <div 
          className={`
            ${sizeClasses[size]} 
            border-4 
            border-gray-200 
            border-t-blue-500 
            rounded-full 
            animate-spin
          `}
        />
        
        {/* Inner pulse effect */}
        <div 
          className={`
            absolute 
            inset-2 
            bg-blue-100 
            rounded-full 
            animate-pulse-fast
            opacity-50
          `}
        />
      </div>
      
      {/* Loading message */}
      {message && (
        <p 
          className={`
            ${textSizeClasses[size]} 
            text-gray-600 
            font-medium 
            mt-4 
            text-center
            animate-pulse
          `}
        >
          {message}
        </p>
      )}
    </div>
  )
}

// Alternative spinning dots component for variety
export function LoadingDots({ 
  size = 'md', 
  message 
}: LoadingSpinnerProps) {
  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }
  
  const textSizeClasses = {
    sm: 'text-tablet-sm',
    md: 'text-tablet-base',
    lg: 'text-tablet-lg'
  }

  return (
    <div className="flex flex-col items-center justify-center p-6">
      {/* Three bouncing dots */}
      <div className="flex space-x-2">
        <div 
          className={`
            ${dotSizes[size]} 
            bg-blue-500 
            rounded-full 
            animate-bounce
          `}
          style={{ animationDelay: '0ms' }}
        />
        <div 
          className={`
            ${dotSizes[size]} 
            bg-blue-400 
            rounded-full 
            animate-bounce
          `}
          style={{ animationDelay: '150ms' }}
        />
        <div 
          className={`
            ${dotSizes[size]} 
            bg-blue-300 
            rounded-full 
            animate-bounce
          `}
          style={{ animationDelay: '300ms' }}
        />
      </div>
      
      {message && (
        <p 
          className={`
            ${textSizeClasses[size]} 
            text-gray-600 
            font-medium 
            mt-4 
            text-center
          `}
        >
          {message}
        </p>
      )}
    </div>
  )
}

// Voice activity indicator component
export function VoiceActivityIndicator({ 
  level = 0, 
  isActive = false,
  size = 'md' 
}: {
  level?: number
  isActive?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }
  
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      {/* Pulsing background based on voice level */}
      <div 
        className={`
          absolute 
          inset-0 
          rounded-full 
          transition-all 
          duration-200
          ${isActive ? 'bg-green-400' : 'bg-gray-300'}
        `}
        style={{
          transform: `scale(${1 + level * 0.3})`,
          opacity: isActive ? 0.3 + level * 0.4 : 0.2
        }}
      />
      
      {/* Microphone icon */}
      <svg 
        className={`
          ${iconSizes[size]} 
          z-10 
          transition-colors 
          duration-200
          ${isActive ? 'text-green-600' : 'text-gray-500'}
        `}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
        />
      </svg>
      
      {/* Outer pulse rings for active state */}
      {isActive && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-20" />
          <div 
            className="absolute inset-0 rounded-full border border-green-300 animate-ping opacity-10" 
            style={{ animationDelay: '0.5s' }}
          />
        </>
      )}
    </div>
  )
}

// Connection status indicator
export function ConnectionStatus({ 
  status,
  size = 'md' 
}: {
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  size?: 'sm' | 'md' | 'lg'
}) {
  const statusConfig = {
    connecting: {
      color: 'bg-yellow-500',
      text: '接続中',
      animate: 'animate-pulse',
      icon: '🔄'
    },
    connected: {
      color: 'bg-green-500',
      text: '接続済み',
      animate: '',
      icon: '✅'
    },
    disconnected: {
      color: 'bg-red-500',
      text: '切断',
      animate: '',
      icon: '❌'
    },
    error: {
      color: 'bg-red-600',
      text: 'エラー',
      animate: 'animate-bounce',
      icon: '⚠️'
    }
  }
  
  const config = statusConfig[status]
  
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  return (
    <div 
      className={`
        inline-flex 
        items-center 
        gap-2 
        rounded-full 
        text-white 
        font-medium 
        ${config.color} 
        ${config.animate} 
        ${sizeClasses[size]}
      `}
    >
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </div>
  )
}