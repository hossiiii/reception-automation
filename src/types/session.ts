// Session management types for reception automation

export interface Session {
  id: string
  role: 'visitor' | 'sales_rejection'
  systemPrompt: string
  createdAt: string
  status: 'active' | 'ended'
  conversations: Conversation[]
}

export interface Conversation {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface RealtimeConfig {
  model: string
  instructions: string
  voice: string
  input_audio_format: string
  output_audio_format: string
  turn_detection: {
    type: string
    threshold: number
    prefix_padding_ms: number
    silence_duration_ms: number
  }
}

// WebSocket message types for OpenAI Realtime API
export interface RealtimeMessage {
  type: string
  [key: string]: any
}

export interface ConversationItem {
  id?: string
  type: 'message'
  role: 'user' | 'assistant' | 'system'
  content: Array<{
    type: 'input_text' | 'input_audio' | 'text'
    text?: string
    audio?: string
  }>
}

// Session hook state types
export interface SessionState {
  isConnected: boolean
  isLoading: boolean
  error: string | null
  conversations: Conversation[]
  audioLevel?: number
  isRecording?: boolean
  isSpeaking?: boolean
}

// API response types
export interface SessionCreateResponse {
  sessionId: string
  status: 'connected'
  wsUrl: string
}

export interface SessionConfigResponse {
  session: Session
  instructions: {
    wsUrl: string
    headers: {
      Authorization: string
      'OpenAI-Beta': string
    }
    config: RealtimeConfig
  }
}

// Slack webhook types
export interface SlackMessage {
  blocks?: SlackBlock[]
  text?: string
  thread_ts?: string
}

export interface SlackBlock {
  type: 'header' | 'section' | 'divider'
  text?: {
    type: 'plain_text' | 'mrkdwn'
    text: string
  }
  fields?: Array<{
    type: 'mrkdwn'
    text: string
  }>
}

export interface SlackWebhookResponse {
  success: boolean
  error?: string
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
}

export type SessionRole = 'visitor' | 'sales_rejection'
export type SessionStatus = 'active' | 'ended'
export type ConversationRole = 'user' | 'assistant'

// Component prop types
export interface SessionScreenProps {
  sessionId: string
  onSessionEnd?: () => void
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

// Hook return types
export interface UseRealtimeSessionReturn {
  isConnected: boolean
  isLoading: boolean
  error: string | null
  conversations: Conversation[]
  sendMessage: (text: string) => void
  generateResponse: () => void
  endSession: () => Promise<void>
  audioLevel?: number
  isRecording?: boolean
  isSpeaking?: boolean
}

// Audio processing types
export interface AudioContext extends globalThis.AudioContext {
  // Extended AudioContext for better type safety
}

export interface MediaStream extends globalThis.MediaStream {
  // Extended MediaStream for better type safety
}

// Environment variables
export interface EnvironmentConfig {
  OPENAI_API_KEY: string
  SLACK_WEBHOOK_URL: string
  NEXT_PUBLIC_BASE_URL: string
  NODE_ENV: 'development' | 'production' | 'test'
}

// Validation schemas (for runtime type checking)
export const SessionRoles = ['visitor', 'sales_rejection'] as const
export const SessionStatuses = ['active', 'ended'] as const
export const ConversationRoles = ['user', 'assistant'] as const

// Type guards
export function isValidSessionRole(role: string): role is SessionRole {
  return SessionRoles.includes(role as SessionRole)
}

export function isValidSessionStatus(status: string): status is SessionStatus {
  return SessionStatuses.includes(status as SessionStatus)
}

export function isValidConversationRole(role: string): role is ConversationRole {
  return ConversationRoles.includes(role as ConversationRole)
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Session creation payload
export type CreateSessionPayload = {
  role: SessionRole
  sessionId: string
}

// Session update payload
export type UpdateSessionPayload = {
  sessionId: string
  role: ConversationRole
  content: string
}

// Slack message options
export interface SlackMessageOptions {
  threadTs?: string
  channel?: string
}