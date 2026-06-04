import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import RecipeCard from '../components/RecipeCard'
import Spinner from '../components/Spinner'
import { Recipe } from '../lib/types'
import { suggestRecipe } from '../lib/claude'

const QUICK_TAGS = ['Snel', 'Pasta', 'Aziatisch', 'Vegetarisch', 'Soep', 'Vlees', 'Vis', 'Salade', 'Ontbijt', 'Dessert']

export default function HomeView() {
  const { config, db } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<{ title: string; reason: string } | null>(null)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!db) return
    setLoading(true)
    const term = activeTag ?? query.trim()
    if (term) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => search(term), 300)
    } else {
      loadRecent()
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTag, db])

  async function loadRecent() {
    if (!db) return
    setLoading(true)
    const { data } = await db.from('recipes').select('*').order('created_at', { ascending: false }).limit(6)
    setRecipes((data as Recipe[]) ?? [])
    setLoading(false)
  }

  async function search(term: string) {
    if (!db) return
    setLoading(true)
    const { data } = await db
      .from('recipes')
      .select('*')
      .or(`title.ilike.%${term}%,cuisine.ilike.%${term}%,tags.cs.{"${term}"}`)
      .order('created_at', { ascending: false })
    setRecipes((data as Recipe[]) ?? [])
    setLoading(false)
  }

  async function handleSuggest() {
    if (!config || !query.trim()) return
    setSuggestLoading(true)
    setSuggestion(null)
    try {
      const result = await suggestRecipe(query.trim(), config)
      setSuggestion(result)
    } finally {
      setSuggestLoading(false)
    }
  }

  if (!db) {
    return (
      <div>
        <div className="view-header">
          <h1>Mijn Recepten</h1>
          <p>Sla je favoriete recepten op</p>
        </div>
        <div className="setup-card">
          <h2>Verbinding instellen</h2>
          <p>Verbind je Supabase-database om recepten op te slaan en te zoeken.</p>
          <button className="btn btn-primary" onClick={() => navigate('/settings')}>
            Instellingen openen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="view-header">
        <h1>Mijn Recepten</h1>
        <p>Wat ga je vandaag koken?</p>
      </div>

      <div className="search-container">
        <input
          className="search-input"
          type="text"
          placeholder="Zoek recepten..."
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveTag(null) }}
        />
        {config && (
          <button className="search-btn" onClick={handleSuggest} title="AI-suggestie" disabled={!query.trim()}>
            {suggestLoading
              ? <Spinner size={16} borderWidth={2} />
              : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            }
          </button>
        )}
      </div>

      <div className="quick-tags">
        {QUICK_TAGS.map(tag => (
          <button
            key={tag}
            className={`quick-tag${activeTag === tag ? ' active' : ''}`}
            onClick={() => { setActiveTag(activeTag === tag ? null : tag); setQuery('') }}
          >
            {tag}
          </button>
        ))}
      </div>

      {suggestion && (
        <div className="suggestion-card">
          <div className="suggestion-label">✨ AI-suggestie</div>
          <div className="suggestion-title">{suggestion.title}</div>
          <div className="suggestion-reason">{suggestion.reason}</div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/add')}>
            Recept toevoegen
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-center"><Spinner /></div>
      ) : recipes.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>Geen recepten gevonden</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {recipes.map(r => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      )}
    </div>
  )
}
