import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import RecipeCard from '../components/RecipeCard'
import Spinner from '../components/Spinner'
import { Recipe } from '../lib/types'

export default function RecipesView() {
  const { db } = useApp()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div>
      <div className="view-header">
        <h1>Alle recepten</h1>
        <p>{recipes.length} recept{recipes.length !== 1 ? 'en' : ''}</p>
      </div>

      {loading ? (
        <div className="loading-center"><Spinner /></div>
      ) : recipes.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>Nog geen recepten toegevoegd</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {recipes.map(r => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      )}
    </div>
  )
}
