import OpenAI from 'openai'

// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required')
}

// Create OpenAI client instance
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Constants for Realtime API
export const REALTIME_MODEL = 'gpt-4o-realtime-preview-2024-10-01'
export const REALTIME_WEBSOCKET_URL = `wss://api.openai.com/v1/realtime?model=${REALTIME_MODEL}`

// Default configuration for Realtime API
export const DEFAULT_REALTIME_CONFIG = {
  model: REALTIME_MODEL,
  voice: 'shimmer', // Available voices: alloy, echo, fable, onyx, nova, shimmer
  input_audio_format: 'pcm16',
  output_audio_format: 'pcm16',
  turn_detection: {
    type: 'server_vad', // Voice Activity Detection
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 200,
  },
  // Audio settings optimized for Japanese speech
  audio_settings: {
    sample_rate: 24000,
    channels: 1,
  },
}

// Function to get WebSocket headers for Realtime API
export function getRealtimeHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'OpenAI-Beta': 'realtime=v1',
  }
}

// Function to create session configuration
export function createSessionConfig(instructions: string) {
  return {
    ...DEFAULT_REALTIME_CONFIG,
    instructions,
  }
}

// Function to validate OpenAI API key format
export function validateApiKey(apiKey: string): boolean {
  // OpenAI API keys typically start with 'sk-' and are about 51 characters long
  return apiKey.startsWith('sk-') && apiKey.length >= 40
}

// Error handling utilities for OpenAI API
export class OpenAIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message)
    this.name = 'OpenAIError'
  }
}

// Function to handle OpenAI API errors
export function handleOpenAIError(error: any): OpenAIError {
  if (error.code === 'insufficient_quota') {
    return new OpenAIError(
      'OpenAI API quota exceeded. Please check your usage and billing.',
      error.code,
      429
    )
  }
  
  if (error.code === 'invalid_api_key') {
    return new OpenAIError(
      'Invalid OpenAI API key. Please check your configuration.',
      error.code,
      401
    )
  }
  
  if (error.code === 'model_not_found') {
    return new OpenAIError(
      'The specified model is not available. Please check the model name.',
      error.code,
      404
    )
  }
  
  if (error.status === 429) {
    return new OpenAIError(
      'Rate limit exceeded. Please try again later.',
      'rate_limit_exceeded',
      429
    )
  }
  
  if (error.status >= 500) {
    return new OpenAIError(
      'OpenAI API server error. Please try again later.',
      'server_error',
      error.status
    )
  }
  
  return new OpenAIError(
    error.message || 'An unknown OpenAI API error occurred',
    error.code,
    error.status
  )
}

// Function to test OpenAI API connection
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    await openai.models.list()
    return true
  } catch (error) {
    console.error('OpenAI connection test failed:', error)
    return false
  }
}

// Available voices for the Realtime API
export const AVAILABLE_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced voice' },
  { id: 'echo', name: 'Echo', description: 'Clear, articulate voice' },
  { id: 'fable', name: 'Fable', description: 'Warm, expressive voice' },
  { id: 'onyx', name: 'Onyx', description: 'Deep, resonant voice' },
  { id: 'nova', name: 'Nova', description: 'Bright, energetic voice' },
  { id: 'shimmer', name: 'Shimmer', description: 'Soft, gentle voice' },
] as const

// Function to get voice by ID
export function getVoiceById(voiceId: string) {
  return AVAILABLE_VOICES.find(voice => voice.id === voiceId)
}

// Audio format configurations
export const AUDIO_FORMATS = {
  PCM16: {
    format: 'pcm16',
    sample_rate: 24000,
    channels: 1,
    description: 'Raw 16-bit PCM audio',
  },
  // Note: Other formats may be added in the future
} as const

// Function to create a WebSocket message for the Realtime API
export function createRealtimeMessage(type: string, data: any = {}) {
  return JSON.stringify({
    type,
    ...data,
  })
}

// Common Realtime API message types
export const REALTIME_MESSAGE_TYPES = {
  SESSION_UPDATE: 'session.update',
  INPUT_AUDIO_BUFFER_APPEND: 'input_audio_buffer.append',
  INPUT_AUDIO_BUFFER_COMMIT: 'input_audio_buffer.commit',
  INPUT_AUDIO_BUFFER_CLEAR: 'input_audio_buffer.clear',
  CONVERSATION_ITEM_CREATE: 'conversation.item.create',
  RESPONSE_CREATE: 'response.create',
  RESPONSE_CANCEL: 'response.cancel',
} as const

export default openai