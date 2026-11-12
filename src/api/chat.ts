export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  const data: { reply?: string; error?: string } = await response.json()
  if (!response.ok) throw new Error(data.error ?? '응답을 가져오지 못했어요.')
  if (!data.reply) throw new Error('서버에서 빈 응답을 받았어요.')
  return data.reply
}
