import { NextRequest, NextResponse } from 'next/server'
import { testSlackWebhook } from '@/lib/slack'

// Rate limiting: Slack allows 1 message per second per channel
let lastSlackMessageTime = 0
const SLACK_RATE_LIMIT_MS = 1000

// POST - Send message to Slack webhook
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!process.env.SLACK_WEBHOOK_URL) {
      console.warn('SLACK_WEBHOOK_URL not configured')
      return NextResponse.json({ 
        success: false, 
        message: 'Slack Webhook URL not configured' 
      })
    }
    
    // Rate limiting check
    const now = Date.now()
    const timeSinceLastMessage = now - lastSlackMessageTime
    
    if (timeSinceLastMessage < SLACK_RATE_LIMIT_MS) {
      const waitTime = SLACK_RATE_LIMIT_MS - timeSinceLastMessage
      console.warn(`Rate limiting: waiting ${waitTime}ms before sending to Slack`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    lastSlackMessageTime = Date.now()
    
    // Send to Slack Webhook
    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Reception-Automation/1.0'
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Slack API error: ${response.status} - ${errorText}`)
      
      // Handle specific Slack errors
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        throw new Error(`Rate limited. Retry after ${retryAfter} seconds`)
      }
      
      if (response.status === 400) {
        throw new Error(`Invalid payload: ${errorText}`)
      }
      
      throw new Error(`Slack API error: ${response.status}`)
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Slack notification error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send Slack notification',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

// GET - Test endpoint for webhook validation (development only)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }
  
  try {
    const isWorking = await testSlackWebhook()
    
    return NextResponse.json({
      slack_configured: !!process.env.SLACK_WEBHOOK_URL,
      webhook_working: isWorking,
      rate_limit_info: {
        last_message_time: lastSlackMessageTime,
        time_since_last: Date.now() - lastSlackMessageTime,
        rate_limit_ms: SLACK_RATE_LIMIT_MS
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to test Slack webhook' },
      { status: 500 }
    )
  }
}