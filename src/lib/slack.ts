import type { SlackMessage, SlackBlock, Conversation, SlackMessageOptions } from '@/types/session'

// Helper function to format Slack messages with proper structure
export function formatSlackMessage(
  title: string,
  fields: Array<{ label: string; value: string }>,
  additionalBlocks: SlackBlock[] = [],
  options: SlackMessageOptions = {}
): SlackMessage {
  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: title
      }
    }
  ]
  
  if (fields.length > 0) {
    blocks.push({
      type: 'section',
      fields: fields.map(field => ({
        type: 'mrkdwn' as const,
        text: `*${field.label}:*\n${field.value}`
      }))
    })
  }
  
  blocks.push(...additionalBlocks)
  
  const message: SlackMessage = { blocks }
  
  // Add thread_ts if specified
  if (options.threadTs) {
    message.thread_ts = options.threadTs
  }
  
  return message
}

// Helper function to format conversation history block
export function formatConversationBlock(conversations: Conversation[]): SlackBlock {
  if (conversations.length === 0) {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '会話履歴がありません'
      }
    }
  }
  
  const conversationText = conversations.map(conv => {
    const speaker = conv.role === 'user' ? '👤 来訪者' : '🤖 AI'
    const time = new Date(conv.timestamp).toLocaleTimeString('ja-JP')
    return `[${time}] ${speaker}: ${conv.content}`
  }).join('\n')
  
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `\`\`\`${conversationText}\`\`\``
    }
  }
}

// Helper function to create session summary message
export function createSessionSummaryMessage(
  sessionId: string,
  role: 'visitor' | 'sales_rejection',
  startTime: string,
  endTime: string,
  conversations: Conversation[],
  options: SlackMessageOptions = {}
): SlackMessage {
  const roleText = role === 'visitor' ? '✅ アポイント有り' : '🚫 アポイント無し'
  const duration = calculateDuration(startTime, endTime)
  
  const fields = [
    { label: 'セッションID', value: sessionId },
    { label: 'タイプ', value: roleText },
    { label: '開始時刻', value: new Date(startTime).toLocaleString('ja-JP') },
    { label: '所要時間', value: duration }
  ]
  
  const conversationBlock = formatConversationBlock(conversations)
  
  return formatSlackMessage(
    '🔔 受付セッション終了',
    fields,
    [
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*会話履歴:*'
        }
      },
      conversationBlock
    ],
    options
  )
}

// Helper function to create error notification message
export function createErrorNotificationMessage(
  error: string,
  sessionId?: string,
  context?: any,
  options: SlackMessageOptions = {}
): SlackMessage {
  const fields = [
    { label: 'エラー', value: error },
    ...(sessionId ? [{ label: 'セッションID', value: sessionId }] : []),
    { label: '発生時刻', value: new Date().toLocaleString('ja-JP') }
  ]
  
  const blocks: SlackBlock[] = []
  
  if (context) {
    blocks.push(
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*詳細情報:*'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`${JSON.stringify(context, null, 2)}\`\`\``
        }
      }
    )
  }
  
  return formatSlackMessage('🚨 受付システムエラー', fields, blocks, options)
}

// Helper function to calculate duration
function calculateDuration(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${minutes}分${seconds}秒`
}

// Helper function to create simple text message (with optional thread support)
export function createSimpleMessage(
  text: string,
  options: SlackMessageOptions = {}
): SlackMessage {
  const message: SlackMessage = { text }
  
  // Add thread_ts if specified
  if (options.threadTs) {
    message.thread_ts = options.threadTs
  }
  
  return message
}

// Helper function to convert Slack URL timestamp to thread_ts format
export function parseSlackTimestamp(url: string): string | null {
  // Extract timestamp from URL like: https://opening-line.slack.com/archives/C098BPSPCTB/p1753821926604869
  const match = url.match(/p(\d{10})(\d{6})/)
  if (match) {
    return `${match[1]}.${match[2]}`
  }
  return null
}

// Utility function to test Slack webhook
export async function testSlackWebhook(): Promise<boolean> {
  if (!process.env.SLACK_WEBHOOK_URL) {
    return false
  }
  
  try {
    const testMessage = formatSlackMessage(
      '🧪 Reception Automation - Test Message',
      [
        { label: 'Status', value: 'System is running' },
        { label: 'Time', value: new Date().toLocaleString('ja-JP') }
      ]
    )
    
    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMessage)
    })
    
    return response.ok
  } catch (error) {
    console.error('Slack webhook test failed:', error)
    return false
  }
}