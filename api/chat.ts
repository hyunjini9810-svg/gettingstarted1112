import OpenAI from 'openai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export const SYSTEM_PROMPT = `당신은 한국어로 설명하는 친절한 영어 단어 퀴즈 코치입니다.
사용자가 공부할 주제 또는 난이도 중 하나라도 알려주지 않았다면, 단어를 제시하기 전에 부족한 정보를 짧게 물어보세요.
조건을 알면 관련 영어 단어를 최대 3개까지만 알려주세요. 각 단어마다 한국어 뜻과 짧고 자연스러운 영어 예문 및 예문의 한국어 뜻을 적어주세요.
답변은 간결한 한국어로 작성하고, 마지막에는 배운 단어를 활용한 복습 퀴즈를 정확히 1개만 내세요. 답을 바로 공개하지 마세요.
이전 대화에 나온 단어를 그대로 반복하지 않도록 노력하고, 퀴즈 답을 사용자가 말하면 짧게 채점한 뒤 이어서 필요한 정보를 물어보세요.`

type ChatMessage = { role: 'user' | 'assistant'; content: string }
let openai: OpenAI | undefined

const LEVEL_PATTERN = /\b(beginner|elementary|basic|intermediate|advanced|upper[- ]intermediate)\b|초급|기초|입문|중급|고급|상급|쉬운|어려운/gi
const LEVEL_LABELS: Record<string, string> = {
  beginner: '초급', elementary: '초급', basic: '초급', intermediate: '중급',
  'upper-intermediate': '중상급', 'upper intermediate': '중상급', advanced: '고급',
}

function getLearningContext(messages: ChatMessage[]) {
  const userText = messages.filter(({ role }) => role === 'user').map(({ content }) => content).join(' ')
  const levels = [...userText.matchAll(LEVEL_PATTERN)].map(([level]) =>
    LEVEL_LABELS[level.toLowerCase()] ?? (level === '쉬운' ? '초급' : level === '어려운' ? '고급' : level),
  )
  const topic = userText
    .replace(LEVEL_PATTERN, ' ')
    .replace(/\b(english|vocabulary|words?|please|teach|give|show|for me|topic|level|beginner|easy|hard)\b/gi, ' ')
    .replace(/영어|단어|주제|난이도|알려줘|알려주세요|가르쳐줘|배우고 싶어요|배우고 싶어|공부하고 싶어요|공부하고 싶어|주세요|해줘|해 주세요|주제로|난이도로|원해요|원해|싶어요|싶어/g, ' ')
    .replace(/[\s.,!?·/|:;()[\]{}'"“”‘’]+/g, '')

  return { topic, level: levels.at(-1) }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'POST 요청만 지원해요.' })
  }
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return res.status(500).json({ error: 'OPENAI_API_KEY를 .env.local에 입력해 주세요.' })
  }
  openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const body = req.body as { messages?: unknown } | undefined
  if (!Array.isArray(body?.messages) || body.messages.length === 0 || body.messages.length > 30) {
    return res.status(400).json({ error: '대화 내용을 확인해 주세요.' })
  }
  const messages = body.messages as ChatMessage[]
  const validMessages = messages.every((message) => message &&
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' && message.content.length > 0 && message.content.length <= 2000)
  if (!validMessages || messages.at(-1)?.role !== 'user') {
    return res.status(400).json({ error: '메시지 형식이 올바르지 않아요.' })
  }

  // The first assistant message is the chatbot's built-in greeting. Before the
  // first generated answer, ask only for learning details the user has omitted.
  const isFirstLearningTurn = messages.filter(({ role }) => role === 'assistant').length === 1
  const learningContext = getLearningContext(messages)
  if (isFirstLearningTurn && (!learningContext.topic || !learningContext.level)) {
    const reply = !learningContext.topic && !learningContext.level
      ? '어떤 주제와 난이도로 공부할까요? 예: 여행 초급, 비즈니스 중급'
      : !learningContext.topic
        ? `어떤 주제의 단어를 공부할까요? 난이도는 ${learningContext.level}로 준비할게요.`
        : `“${learningContext.topic}” 주제로 준비할게요. 난이도는 초급·중급·고급 중 어떤 걸 원하세요?`
    return res.status(200).json({ reply })
  }

  try {
    const response = await openai.responses.create({
      model: 'gpt-6-luna',
      reasoning: { effort: 'none' },
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(isFirstLearningTurn ? [{
          role: 'system' as const,
          content: `The user has already specified the learning topic as “${learningContext.topic}” and the difficulty as “${learningContext.level}”. Treat both as confirmed. Do not ask for them again. Provide up to three relevant English vocabulary words with Korean meanings and short example sentences, then exactly one review quiz.`,
        }] : []),
        ...messages.map(({ role, content }) => ({ role, content })),
      ],
    })
    return res.status(200).json({ reply: response.output_text })
  } catch (error) {
    console.error('OpenAI Responses API request failed:', error)
    return res.status(502).json({ error: '답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.' })
  }
}
