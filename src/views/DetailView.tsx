import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import SourceBadge from '../components/SourceBadge'
import Spinner from '../components/Spinner'
import { Recipe } from '../lib/types'

export default function DetailView() {
  const { id } = useParams<{ id: string }>()
  const { db, showToast } = useApp()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!db || !id) { setLoading(false); return }
    db.from('recipes')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setRecipe(data as Recipe)
        setLoading(false)
      })
  }, [db, id])

  async function handleDelete() {
    if (!db || !recipe) return
    if (!window.confirm(`Recept "${recipe.title}" verwijderen?`)) return
    setDeleting(true)
    const { error } = await db.from('recipes').delete().eq('id', recipe.id)
    if (error) {
      showToast('Verwijderen mislukt')
      setDeleting(false)
    } else {
      showToast('Recept verwijderd')
      navigate('/recipes')
    }
  }

  if (loading) return <div className="loading-center"><Spinner /></div>
  if (!recipe) return <div className="empty-state"><p>Recept niet gevonden</p></div>

  return (
    <div>
      <button className="back-btn" onClick={() => navigate(-1)}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Terug
      </button>

      {recipe.image_url && (
        <img className="detail-image" src={recipe.image_url} alt={recipe.title} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <SourceBadge type={recipe.source_type} />
      </div>

      <h1 className="detail-title">{recipe.title}</h1>

      <div className="detail-meta">
        {recipe.cuisine && <span>{recipe.cuisine}</span>}
        {recipe.prep_time && <span>⏱ {recipe.prep_time} min</span>}
        {recipe.servings && <span>👥 {recipe.servings} pers.</span>}
      </div>

      {recipe.tags.length > 0 && (
        <div className="tags">
          {recipe.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
        </div>
      )}

      {recipe.source_url && (
        <a className="source-link" href={recipe.source_url} target="_blank" rel="noreferrer">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Bron bekijken
        </a>
      )}

      <div className="detail-section">
        <div className="detail-section-label">Ingrediënten</div>
        <p>{recipe.ingredients}</p>
      </div>

      <div className="detail-section">
        <div className="detail-section-label">Bereidingswijze</div>
        <p>{recipe.instructions}</p>
      </div>

      {recipe.notes && (
        <div className="detail-section">
          <div className="detail-section-label">Notities</div>
          <p>{recipe.notes}</p>
        </div>
      )}

      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn btn-primary" onClick={() => navigate(`/recipe/${recipe.id}/cooking`)}>
          Koken maar! 👨‍🍳
        </button>
        <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? <Spinner size={18} borderWidth={2} /> : 'Recept verwijderen'}
        </button>
      </div>

      <div style={{ height: 24 }} />
    </div>
  )
}
