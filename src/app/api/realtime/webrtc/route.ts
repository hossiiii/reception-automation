import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { sdp, model } = await request.json()
    
    if (!sdp) {
      return NextResponse.json(
        { error: 'SDP offer is required' },
        { status: 400 }
      )
    }
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }
    
    const targetModel = model || 'gpt-4o-realtime-preview-2024-10-01'
    
    // Send SDP offer to OpenAI WebRTC endpoint
    const response = await fetch(`https://api.openai.com/v1/realtime?model=${targetModel}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/sdp',
      },
      body: sdp
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI WebRTC error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to establish WebRTC connection' },
        { status: response.status }
      )
    }
    
    const answerSdp = await response.text()
    
    return NextResponse.json({
      sdp: answerSdp
    })
    
  } catch (error) {
    console.error('WebRTC setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}