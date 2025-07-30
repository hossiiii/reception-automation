'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { 
  Conversation, 
  UseRealtimeSessionReturn, 
  SessionScreenProps 
} from '@/types/session'

interface UseRealtimeSessionProps {
  sessionId: string
  onSessionEnd?: () => void
}

export function useRealtimeSession({ 
  sessionId, 
  onSessionEnd 
}: UseRealtimeSessionProps): UseRealtimeSessionReturn {
  // State management
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [audioLevel, setAudioLevel] = useState<number>(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  // Refs for managing WebRTC and audio resources
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const processedMessageIds = useRef<Set<string>>(new Set())
  
  // Initialize connection to Realtime API
  const initializeConnection = useCallback(async () => {
    try {
      // Prevent duplicate initialization
      if (isConnected || isLoading || pcRef.current) {
        console.log('Connection already in progress or established')
        return
      }

      setIsLoading(true)
      setError(null)

      // Get session configuration for system prompt
      const sessionResponse = await fetch(`/api/realtime?sessionId=${sessionId}`)
      if (!sessionResponse.ok) {
        throw new Error('Failed to get session configuration')
      }
      
      const { session } = await sessionResponse.json()

      console.log('Setting up WebRTC connection with API key')
      
      // Initialize audio first to get the stream
      await initializeAudio()
      
      // Create WebRTC peer connection
      const pc = new RTCPeerConnection()
      
      // Add audio track if available
      if (mediaStreamRef.current) {
        const audioTrack = mediaStreamRef.current.getAudioTracks()[0]
        if (audioTrack) {
          pc.addTrack(audioTrack, mediaStreamRef.current)
          console.log('Added audio track to peer connection')
        }
      }
      
      // Create data channel for communication with OpenAI
      const dataChannel = pc.createDataChannel('oai-events', {
        ordered: true
      })
      
      dataChannel.onopen = () => {
        console.log('Data channel opened')
        
        // Send initial session configuration
        dataChannel.send(JSON.stringify({
          type: 'session.update',
          session: {
            model: 'gpt-4o-realtime-preview-2024-10-01',
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            instructions: session.systemPrompt,
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 200
            }
          }
        }))
        
        setIsConnected(true)
        setIsLoading(false)
      }

      dataChannel.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data)
          await handleRealtimeMessage(data)
        } catch (err) {
          console.error('Error parsing data channel message:', err)
        }
      }

      dataChannel.onerror = (error) => {
        console.error('Data channel error:', error)
        setError('Data channel error occurred')
        setIsLoading(false)
      }

      dataChannel.onclose = () => {
        console.log('Data channel closed')
        setIsConnected(false)
        setIsLoading(false)
      }

      // Set up peer connection event handlers
      pc.onicecandidate = (event) => {
        // In a real implementation, ICE candidates would be exchanged
        console.log('ICE candidate:', event.candidate)
      }

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState)
        if (pc.connectionState === 'failed') {
          setError('WebRTC connection failed')
          setIsLoading(false)
        }
      }

      // Handle incoming audio stream from OpenAI
      pc.ontrack = (event) => {
        console.log('Received audio track from OpenAI')
        const [remoteStream] = event.streams
        
        // Clean up existing audio element if any
        if (remoteAudioRef.current) {
          remoteAudioRef.current.pause()
          if (remoteAudioRef.current.parentNode) {
            remoteAudioRef.current.parentNode.removeChild(remoteAudioRef.current)
          }
          remoteAudioRef.current = null
        }
        
        // Create single audio element to play the response
        const audioElement = document.createElement('audio')
        audioElement.srcObject = remoteStream
        audioElement.autoplay = true
        audioElement.controls = false
        audioElement.volume = 1.0
        
        // Store reference to prevent duplicates
        remoteAudioRef.current = audioElement
        
        // Add to DOM temporarily (required for some browsers)
        document.body.appendChild(audioElement)
        
        // Play the audio
        audioElement.play().then(() => {
          console.log('Playing AI response audio')
          setIsSpeaking(true)
        }).catch((error) => {
          console.error('Error playing audio:', error)
        })
        
        // Clean up when audio ends
        audioElement.onended = () => {
          console.log('AI response audio ended')
          setIsSpeaking(false)
          if (audioElement.parentNode) {
            audioElement.parentNode.removeChild(audioElement)
          }
          remoteAudioRef.current = null
        }
        
        // Also clean up if audio errors
        audioElement.onerror = () => {
          console.error('Audio playback error')
          setIsSpeaking(false)
          if (audioElement.parentNode) {
            audioElement.parentNode.removeChild(audioElement)
          }
          remoteAudioRef.current = null
        }
      }

      // Create offer and set local description
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Send offer to our API endpoint which will forward to OpenAI
      const rtcResponse = await fetch('/api/realtime/webrtc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sdp: offer.sdp,
          model: 'gpt-4o-realtime-preview-2024-10-01'
        })
      })

      if (!rtcResponse.ok) {
        const errorData = await rtcResponse.json()
        throw new Error(`WebRTC setup failed: ${errorData.error || rtcResponse.status}`)
      }

      const { sdp: answerSdp } = await rtcResponse.json()
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp
      })

      pcRef.current = pc
      dataChannelRef.current = dataChannel

    } catch (err) {
      console.error('Connection initialization error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize connection'
      setError(errorMessage)
      setIsLoading(false)
    }
  }, [sessionId])

  // Initialize audio context and microphone
  const initializeAudio = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          channelCount: 1
        } 
      })
      mediaStreamRef.current = stream

      // Create audio context (requires user gesture)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      })
      audioContextRef.current = audioContext

      // Set up audio analysis for visual feedback
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // Start audio level monitoring
      startAudioLevelMonitoring()

    } catch (err) {
      console.error('Audio initialization error:', err)
      setError('Microphone access required for voice interaction')
    }
  }

  // Monitor audio levels for visual feedback
  const startAudioLevelMonitoring = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    
    const updateAudioLevel = () => {
      if (!analyserRef.current) return

      analyserRef.current.getByteFrequencyData(dataArray)
      
      // Calculate average audio level
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
      const normalizedLevel = average / 255
      
      setAudioLevel(normalizedLevel)
      setIsRecording(normalizedLevel > 0.01) // Threshold for detecting speech
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
    }
    
    updateAudioLevel()
  }

  // Handle incoming Realtime API messages
  const handleRealtimeMessage = async (data: any) => {
    // Generate unique message ID for deduplication
    const messageId = `${data.type}-${data.item?.id || data.response_id || data.event_id || Date.now()}-${JSON.stringify(data).length}`
    
    // Skip if we've already processed this message
    if (processedMessageIds.current.has(messageId)) {
      console.log(`Skipping duplicate message: ${data.type}`)
      return
    }
    
    // Mark message as processed
    processedMessageIds.current.add(messageId)
    
    // Clean up old message IDs (keep last 100)
    if (processedMessageIds.current.size > 100) {
      const messageArray = Array.from(processedMessageIds.current)
      processedMessageIds.current = new Set(messageArray.slice(-50))
    }
    
    switch (data.type) {
      case 'conversation.item.created':
        if (data.item.role === 'user' || data.item.role === 'assistant') {
          const newConversation: Conversation = {
            role: data.item.role,
            content: data.item.content?.[0]?.text || data.item.content?.[0]?.transcript || '',
            timestamp: new Date().toISOString()
          }
          
          // Check for duplicates before adding to state
          const isDuplicate = conversations.some(conv => 
            conv.content === newConversation.content && 
            conv.role === newConversation.role &&
            Date.now() - new Date(conv.timestamp).getTime() < 5000
          )
          
          if (!isDuplicate && newConversation.content.trim()) {
            setConversations(prev => [...prev, newConversation])
            // Record conversation on server
            await recordConversation(sessionId, newConversation)
          }
          
          // Note: OpenAI Realtime API automatically generates responses with server_vad
          // No need to manually trigger response.create
        }
        break
        
      case 'response.audio.delta':
        // Audio response is being generated
        console.log('Audio delta received from OpenAI')
        setIsSpeaking(true)
        break
        
      case 'response.audio.done':
        // Audio response finished
        console.log('Audio response completed')
        setIsSpeaking(false)
        break
        
      case 'response.output_item.added':
        // Text response added
        if (data.item?.content?.[0]?.text) {
          console.log('Text response:', data.item.content[0].text)
        }
        break
        
      case 'response.audio_transcript.delta':
        // Audio transcript being generated
        console.log('Audio transcript delta:', data.delta)
        break
        
      case 'response.audio_transcript.done':
        // Complete audio transcript
        if (data.transcript && data.transcript.trim()) {
          console.log('Complete transcript:', data.transcript)
          
          // Check for duplicates before adding
          const isDuplicate = conversations.some(conv => 
            conv.content === data.transcript && 
            conv.role === 'assistant' &&
            Date.now() - new Date(conv.timestamp).getTime() < 5000
          )
          
          if (!isDuplicate) {
            // Add assistant message to conversation
            const assistantMessage: Conversation = {
              role: 'assistant',
              content: data.transcript,
              timestamp: new Date().toISOString()
            }
            setConversations(prev => [...prev, assistantMessage])
            await recordConversation(sessionId, assistantMessage)
          }
        }
        break
        
      case 'error':
        console.error('Realtime API error:', data.error)
        setError(data.error.message || 'An error occurred during conversation')
        break
        
      case 'response.done':
        // Response completed
        setIsSpeaking(false)
        break
        
      default:
        // Log unknown message types for debugging
        console.log('Unknown message type:', data.type)
    }
  }

  // Record conversation message on server
  const recordConversation = async (sessionId: string, conversation: Conversation) => {
    try {
      // Check for duplicate content in recent conversations
      const isDuplicate = conversations.some(conv => 
        conv.content === conversation.content && 
        conv.role === conversation.role &&
        Date.now() - new Date(conv.timestamp).getTime() < 5000 // Within 5 seconds
      )
      
      if (isDuplicate) {
        console.log('Skipping duplicate conversation record')
        return
      }

      await fetch('/api/realtime', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          role: conversation.role,
          content: conversation.content
        })
      })
    } catch (error) {
      console.error('Failed to record conversation:', error)
    }
  }

  // Send text message to the AI
  const sendMessage = useCallback((text: string) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{
            type: 'input_text',
            text
          }]
        }
      }))
    } else {
      console.error('Data channel not connected')
      setError('Not connected to voice service')
    }
  }, [])

  // Generate AI response
  const generateResponse = useCallback(() => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify({
        type: 'response.create'
      }))
    } else {
      console.error('Data channel not connected')
      setError('Not connected to voice service')
    }
  }, [])

  // End session and clean up resources
  const endSession = useCallback(async () => {
    try {
      // Stop audio level monitoring
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      // Clean up remote audio
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause()
        if (remoteAudioRef.current.parentNode) {
          remoteAudioRef.current.parentNode.removeChild(remoteAudioRef.current)
        }
        remoteAudioRef.current = null
      }

      // Close WebRTC connection
      if (dataChannelRef.current) {
        dataChannelRef.current.close()
        dataChannelRef.current = null
      }
      
      if (pcRef.current) {
        pcRef.current.close()
        pcRef.current = null
      }

      // Stop media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }

      // Close audio context
      if (audioContextRef.current) {
        await audioContextRef.current.close()
        audioContextRef.current = null
      }

      // Call server to end session and send to Slack
      await fetch('/api/realtime', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      setIsConnected(false)
      setIsRecording(false)
      setIsSpeaking(false)
      setAudioLevel(0)
      
      // Call callback if provided
      if (onSessionEnd) {
        onSessionEnd()
      }
    } catch (error) {
      console.error('Failed to end session:', error)
      setError('Failed to end session properly')
    }
  }, [sessionId, onSessionEnd])

  // Initialize connection when component mounts
  useEffect(() => {
    // Add sessionId to ensure unique connection per session
    const connectionKey = `realtime-session-${sessionId}`
    
    // Check if this session is already connecting/connected globally
    if (window && (window as any)[connectionKey]) {
      console.log(`Session ${sessionId} already has an active connection`)
      return
    }
    
    // Mark this session as active
    if (window) {
      (window as any)[connectionKey] = true
    }
    
    initializeConnection()

    // Cleanup on unmount
    return () => {
      // Clear the global connection marker
      const connectionKey = `realtime-session-${sessionId}`
      if (window && (window as any)[connectionKey]) {
        delete (window as any)[connectionKey]
      }
      
      // Cancel any pending animation frames
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      // Clean up remote audio
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause()
        if (remoteAudioRef.current.parentNode) {
          remoteAudioRef.current.parentNode.removeChild(remoteAudioRef.current)
        }
      }

      // Close connections without calling server (component unmounting)
      if (dataChannelRef.current) {
        dataChannelRef.current.close()
      }
      if (pcRef.current) {
        pcRef.current.close()
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [sessionId, initializeConnection])

  return {
    isConnected,
    isLoading,
    error,
    conversations,
    sendMessage,
    generateResponse,
    endSession,
    audioLevel,
    isRecording,
    isSpeaking
  }
}