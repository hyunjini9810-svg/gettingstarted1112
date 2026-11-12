import { useEffect, useRef, useState, type FormEvent } from 'react'
import { sendChatMessage, type ChatMessage } from '../api/chat'

type Message = ChatMessage & { id: number }
const starterPrompts = ['여행 영어 초급', '음식과 요리 중급', '비즈니스 회화']

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([{ id: 0, role: 'assistant', content: '어떤 주제와 난이도로 영어 단어를 공부할까요?\n예: 여행 초급, 비즈니스 중급' }])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const nextId = useRef(1)
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  async function submitMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    const userMessage: Message = { id: nextId.current++, role: 'user', content: trimmed }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages); setInput(''); setError(''); setIsLoading(true)
    try {
      const reply = await sendChatMessage(nextMessages.map(({ role, content }) => ({ role, content })))
      setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', content: reply }])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '문제가 생겼어요. 다시 시도해 주세요.')
    } finally { setIsLoading(false) }
  }
  function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void submitMessage(input) }

  return <main className="page-shell">
    <header className="topbar"><a className="brand" href="#top" aria-label="Wordmate 홈"><span className="brand-mark">W</span> wordmate</a><span className="topbar-note"><span className="status-dot" /> AI 영어 단어 코치</span></header>
    <section className="workspace" id="top">
      <aside className="intro-panel">
        <div className="eyebrow"><span className="sparkle">✳</span> YOUR DAILY ENGLISH</div>
        <h1>단어가 쌓이면<br /><span>영어가 자라요.</span></h1>
        <p className="intro-copy">관심 있는 주제를 골라 보세요.<br />딱 맞는 단어와 짧은 퀴즈를 준비할게요.</p>
        <div className="lesson-card"><div className="lesson-icon">✦</div><div><strong>오늘의 학습</strong><p>단어 3개 · 복습 퀴즈 1개</p></div><span className="lesson-arrow">↗</span></div>
        <div className="topic-heading"><span>이런 주제는 어때요?</span><span className="topic-line" /></div>
        <div className="topic-list"><span>✈️ 여행</span><span>☕ 일상</span><span>🍜 음식</span><span>💼 비즈니스</span></div>
        <div className="side-quote"><span>“</span><p>Small steps every day<br />lead to big changes.</p><small>매일의 작은 걸음이 큰 변화를 만들어요.</small></div>
      </aside>
      <section className="chat-panel" aria-label="영어 단어 퀴즈 채팅">
        <div className="chat-heading"><div className="bot-avatar">W<span>✦</span></div><div className="chat-title"><h2>단어 퀴즈 챗봇</h2><p><span className="status-dot" /> 지금 바로 대화할 수 있어요</p></div><button className="more-button" type="button" aria-label="더 보기">···</button></div>
        <div className="messages" aria-live="polite"><div className="date-divider"><span>오늘</span></div>
          {messages.map((message) => <div className={`message-row ${message.role}`} key={message.id}>
            {message.role === 'assistant' && <div className="mini-avatar">W</div>}
            <div className="message-content">{message.role === 'assistant' && <span className="sender-name">Wordmate</span>}<div className="bubble">{message.content.split('\n').map((line, index, lines) => <span key={index}>{line}{index < lines.length - 1 && <br />}</span>)}</div><time>{message.role === 'assistant' ? '방금' : '나'}</time></div>
          </div>)}
          {isLoading && <div className="message-row assistant"><div className="mini-avatar">W</div><div className="typing-bubble"><i /><i /><i /></div></div>}
          <div ref={bottomRef} />
        </div>
        {messages.length <= 1 && <div className="suggestions"><span>빠른 시작</span>{starterPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => void submitMessage(prompt)} disabled={isLoading}>{prompt}<b>↗</b></button>)}</div>}
        {error && <p className="error-message" role="alert">{error}</p>}
        <form className="composer" onSubmit={handleSubmit}><label className="sr-only" htmlFor="chat-input">공부할 주제나 난이도 입력</label><input id="chat-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="공부하고 싶은 주제나 난이도를 입력해 주세요" disabled={isLoading} /><button type="submit" aria-label="메시지 보내기" disabled={!input.trim() || isLoading}><span>↑</span></button></form>
        <p className="privacy-note"><span>✧</span> 영어 학습을 위한 대화예요. 편하게 시작해 보세요!</p>
      </section>
    </section>
    <footer className="page-footer"><span>© 2025 WORDMATE</span><span>하루 한 단어, 조금씩 더 자신 있게.</span></footer>
  </main>
}
