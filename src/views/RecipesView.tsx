import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import RecipeCard from '../components/RecipeCard'
import Spinner from '../components/Spinner'
import { Recipe } from '../lib/types'

export default function RecipesView() {
  const { db, showToast } = useApp()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [showFavorites, setShowFavorites] = useState(false)

  useEffect(() => {
    if (!db) { setLoading(false); return }
    db.from('recipes')
      .select('*')
      .order('title', { ascending: true })
      .then(({ data }) => {
        setRecipes((data as Recipe[]) ?? [])
        setLoading(false)
      })
  }, [db])

  async function handleToggleFavorite(id: string, isFavorite: boolean) {
    if (!db) return
    const { error } = await db.from('recipes').update({ is_favorite: isFavorite }).eq('id', id)
    if (error) {
      showToast('Opslaan mislukt')
    } else {
      setRecipes(prev => prev.map(r => r.id === id ? { ...r, is_favorite: isFavorite } : r))
    }
  }

  const displayed = showFavorites ? recipes.filter(r => r.is_favorite) : recipes

  return (
    <div>
      <div className="view-header">
        <h1>Alle recepten</h1>
        <p>{recipes.length} recept{recipes.length !== 1 ? 'en' : ''}</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setShowFavorites(false)}
          className={`tag${!showFavorites ? ' tag-active' : ''}`}
          style={{ cursor: 'pointer', border: 'none' }}
        >
          Alle
        </button>
        <button
          onClick={() => setShowFavorites(true)}
          className={`tag${showFavorites ? ' tag-active' : ''}`}
          style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24"
            fill={showFavorites ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Favorieten
        </button>
      </div>

      {loading ? (
        <div className="loading-center"><Spinner /></div>
      ) : displayed.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>{showFavorites ? 'Nog geen favorieten gemarkeerd' : 'Nog geen recepten toegevoegd'}</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {displayed.map(r => (
            <RecipeCard key={r.id} recipe={r} onToggleFavorite={handleToggleFavorite} />
          ))}
        </div>
      )}
    </div>
  )
}
