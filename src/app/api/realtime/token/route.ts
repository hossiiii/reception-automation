import { NextRequest, NextResponse } from 'next/server'

// Generate ephemeral token for OpenAI Realtime API
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }
    
    // Generate ephemeral token from OpenAI
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-10-01',
        voice: 'shimmer',
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to create ephemeral token:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to generate ephemeral token' },
        { status: response.status }
      )
    }
    
    const tokenData = await response.json()
    
    return NextResponse.json({
      token: tokenData.client_secret.value,
      expires_at: tokenData.client_secret.expires_at,
      session_id: tokenData.id,
      websocket_url: `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`
    })
    
  } catch (error) {
    console.error('Ephemeral token generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}