import { NextRequest, NextResponse } from 'next/server'
import { getSystemPrompt } from '@/lib/prompts'
import { createSessionConfig, REALTIME_WEBSOCKET_URL, getRealtimeHeaders, handleOpenAIError } from '@/lib/openai'
import type { Session, SessionRole, Conversation } from '@/types/session'

// Memory-based session storage (no database required as per PRP)
// Use global to persist across hot reloads in development
const globalForSessions = globalThis as unknown as {
  sessions: Map<string, Session> | undefined
}

const sessions = globalForSessions.sessions ?? new Map<string, Session>()
globalForSessions.sessions = sessions

// POST - Create new session
export async function POST(request: NextRequest) {
  try {
    const { role, sessionId } = await request.json()
    
    console.log(`[SESSION-DEBUG] Creating session with ID: ${sessionId}, role: ${role}`)
    
    // Validate input
    if (!role || !sessionId) {
      return NextResponse.json(
        { error: 'Role and sessionId are required' },
        { status: 400 }
      )
    }
    
    if (role !== 'visitor' && role !== 'sales_rejection') {
      return NextResponse.json(
        { error: 'Invalid role. Must be "visitor" or "sales_rejection"' },
        { status: 400 }
      )
    }
    
    // Get system prompt based on role
    const systemPrompt = getSystemPrompt(role as SessionRole)
    
    // Create session in memory
    const session: Session = {
      id: sessionId,
      role: role as SessionRole,
      systemPrompt,
      createdAt: new Date().toISOString(),
      status: 'active',
      conversations: []
    }
    
    // Store session in memory
    sessions.set(sessionId, session)
    console.log(`[SESSION-DEBUG] Session stored. Total sessions: ${sessions.size}`)
    console.log(`[SESSION-DEBUG] Session keys: ${Array.from(sessions.keys()).join(', ')}`)
    
    return NextResponse.json({
      sessionId,
      status: 'connected',
      wsUrl: REALTIME_WEBSOCKET_URL
    })
    
  } catch (error) {
    console.error('Realtime API session creation error:', error)
    const openaiError = handleOpenAIError(error)
    return NextResponse.json(
      { error: openaiError.message },
      { status: openaiError.status || 500 }
    )
  }
}

// GET - Get session configuration for WebSocket connection
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId')
  
  if (!sessionId || !sessions.has(sessionId)) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    )
  }
  
  const session = sessions.get(sessionId)!
  
  try {
    const headers = getRealtimeHeaders()
    const config = createSessionConfig(session.systemPrompt)
    
    return NextResponse.json({
      session,
      instructions: {
        wsUrl: REALTIME_WEBSOCKET_URL,
        headers,
        config
      }
    })
    
  } catch (error) {
    console.error('Session config retrieval error:', error)
    const openaiError = handleOpenAIError(error)
    return NextResponse.json(
      { error: openaiError.message },
      { status: openaiError.status || 500 }
    )
  }
}

// DELETE - End session and send conversation history to Slack
export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    
    console.log(`[SESSION-DEBUG] Attempting to delete session: ${sessionId}`)
    console.log(`[SESSION-DEBUG] Available sessions before delete: ${Array.from(sessions.keys()).join(', ')}`)
    console.log(`[SESSION-DEBUG] Total sessions: ${sessions.size}`)
    
    if (!sessionId || !sessions.has(sessionId)) {
      console.log(`[SESSION-DEBUG] Session not found during DELETE: ${sessionId}`)
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    const session = sessions.get(sessionId)!
    session.status = 'ended'
    
    console.log(`[SESSION-DEBUG] Found session. Conversations: ${session.conversations.length}`)
    console.log(`[SESSION-DEBUG] Session role: ${session.role}`)
    
    // Send conversation history to Slack
    await sendConversationToSlack(session)
    
    // Remove session from memory
    sessions.delete(sessionId)
    console.log(`[SESSION-DEBUG] Session deleted. Remaining sessions: ${sessions.size}`)
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Session termination error:', error)
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    )
  }
}

// PUT - Record conversation message
export async function PUT(request: NextRequest) {
  try {
    const { sessionId, role, content } = await request.json()
    
    console.log(`[SESSION-DEBUG] Recording conversation for session: ${sessionId}, role: ${role}`)
    
    if (!sessionId || !sessions.has(sessionId)) {
      console.log(`[SESSION-DEBUG] Session not found during PUT: ${sessionId}`)
      console.log(`[SESSION-DEBUG] Available sessions: ${Array.from(sessions.keys()).join(', ')}`)
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      )
    }
    
    if (role !== 'user' && role !== 'assistant') {
      return NextResponse.json(
        { error: 'Invalid role. Must be "user" or "assistant"' },
        { status: 400 }
      )
    }
    
    const session = sessions.get(sessionId)!
    const conversation: Conversation = {
      role,
      content,
      timestamp: new Date().toISOString()
    }
    
    session.conversations.push(conversation)
    console.log(`[SESSION-DEBUG] Conversation recorded. Total conversations: ${session.conversations.length}`)
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Conversation recording error:', error)
    return NextResponse.json(
      { error: 'Failed to record conversation' },
      { status: 500 }
    )
  }
}

// Helper function to send conversation history to Slack
async function sendConversationToSlack(session: Session) {
  console.log(`[SLACK-DEBUG] Sending conversation to Slack for session: ${session.id}`)
  
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.warn('SLACK_WEBHOOK_URL not configured - skipping Slack notification')
    return
  }
  
  console.log(`[SLACK-DEBUG] Webhook URL configured: ${process.env.SLACK_WEBHOOK_URL.substring(0, 50)}...`)
  
  const roleText = session.role === 'visitor' ? '✅ アポイント有り' : '🚫 アポイント無し'
  const duration = calculateDuration(session.createdAt, new Date().toISOString())
  
  // Format conversation history
  const conversationText = session.conversations.length > 0
    ? session.conversations.map(conv => {
        const speaker = conv.role === 'user' ? '👤 来訪者' : '🤖 AI'
        const time = new Date(conv.timestamp).toLocaleTimeString('ja-JP')
        return `[${time}] ${speaker}: ${conv.content}`
      }).join('\n')
    : '会話履歴がありません'
  
  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🔔 受付セッション終了'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*セッションID:*\n${session.id}`
          },
          {
            type: 'mrkdwn',
            text: `*タイプ:*\n${roleText}`
          },
          {
            type: 'mrkdwn',
            text: `*開始時刻:*\n${new Date(session.createdAt).toLocaleString('ja-JP')}`
          },
          {
            type: 'mrkdwn',
            text: `*所要時間:*\n${duration}`
          }
        ]
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*会話履歴:*'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`${conversationText}\`\`\``
        }
      }
    ]
  }
  
  try {
    console.log(`[SLACK-DEBUG] Sending message with ${session.conversations.length} conversations`)
    console.log(`[SLACK-DEBUG] Message blocks count: ${message.blocks.length}`)
    
    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[SLACK-DEBUG] Slack webhook failed: ${response.status}`, errorText)
    } else {
      console.log(`[SLACK-DEBUG] Slack notification sent successfully`)
    }
  } catch (error) {
    console.error('[SLACK-DEBUG] Slack notification error:', error)
  }
}

// Helper function to calculate session duration
function calculateDuration(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${minutes}分${seconds}秒`
}

// GET /api/realtime/sessions - List active sessions (for debugging)
export async function PATCH(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }
  
  const activeSessions = Array.from(sessions.values()).map(session => ({
    id: session.id,
    role: session.role,
    status: session.status,
    createdAt: session.createdAt,
    conversationCount: session.conversations.length
  }))
  
  return NextResponse.json({
    sessions: activeSessions,
    count: activeSessions.length
  })
}