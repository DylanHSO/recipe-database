import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Spinner from '../components/Spinner'
import { Recipe } from '../lib/types'
import { callClaude } from '../lib/claude'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function CookingView() {
  const { id } = useParams<{ id: string }>()
  const { db, config } = useApp()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set())
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set())
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!db || !id) { setLoading(false); return }
    db.from('recipes').select('*').eq('id', id).single().then(({ data }) => {
      setRecipe(data as Recipe)
      setLoading(false)
    })
  }, [db, id])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function toggleIngredient(i: number) {
    setCheckedIngredients(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function toggleStep(i: number) {
    setDoneSteps(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  async function sendMessage() {
    if (!chatInput.trim() || chatLoading || !recipe || !config) return
    const userMsg = chatInput.trim()
    setChatInput('')
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setChatLoading(true)

    try {
      const systemPrompt = `Je bent een behulpzame kookassistent. Je helpt de gebruiker met het recept: "${recipe.title}".
Ingrediënten: ${recipe.ingredients}
Bereidingswijze: ${recipe.instructions}
Geef korte, praktische antwoorden in het Nederlands.`

      const response = await callClaude(
        {
          system: systemPrompt,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        },
        config.netlifyUrl,
      )
      setMessages([...newMessages, { role: 'assistant', content: response }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, er ging iets mis.' }])
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) return <div className="loading-center"><Spinner /></div>
  if (!recipe) return <div className="empty-state"><p>Recept niet gevonden</p></div>

  const ingredients = recipe.ingredients.split('\n').filter(Boolean)
  const steps = recipe.instructions.split('\n').filter(Boolean)

  return (
    <div className="cooking-view" style={{ paddingBottom: 120 }}>
      <div style={{ padding: '12px 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="back-btn" style={{ marginBottom: 0 }} onClick={() => navigate(-1)}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 style={{ fontSize: '1.125rem', flex: 1 }}>{recipe.title}</h1>
      </div>

      <div className="cooking-section">
        <div className="detail-section-label">Ingrediënten</div>
        <div className="cooking-checklist">
          {ingredients.map((ing, i) => (
            <label key={i} className="check-item">
              <input type="checkbox" checked={checkedIngredients.has(i)} onChange={() => toggleIngredient(i)} />
              <span className="check-text">{ing}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="cooking-section">
        <div className="detail-section-label">Stappen</div>
        <div className="cooking-steps">
          {steps.map((step, i) => (
            <div key={i} className={`cooking-step${doneSteps.has(i) ? ' done' : ''}`} onClick={() => toggleStep(i)}>
              <div className="step-num">{i + 1}</div>
              <div className="step-text">{step.replace(/^\d+[\.\)]\s*/, '')}</div>
            </div>
          ))}
        </div>
      </div>

      {config && (
        <div className="cooking-section">
          <div className="detail-section-label">Kookassistent</div>
          <div className="cooking-chat">
            {messages.length === 0 && (
              <div className="chat-msg chat-assistant">
                Hoi! Ik help je met het bereiden van {recipe.title}. Stel gerust een vraag!
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role === 'user' ? 'chat-user' : 'chat-assistant'}`}
                style={{ whiteSpace: 'pre-wrap' }}>
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className="chat-msg chat-assistant chat-thinking">
                <Spinner size={18} borderWidth={2} />
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        </div>
      )}

      {config && (
        <div className="cooking-input-bar">
          <input
            className="cooking-input"
            type="text"
            placeholder="Stel een vraag..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
          />
          <button className="cooking-send-btn" onClick={sendMessage} disabled={chatLoading || !chatInput.trim()}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
