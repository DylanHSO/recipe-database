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
  const [togglingFav, setTogglingFav] = useState(false)

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

  async function handleToggleFavorite() {
    if (!db || !recipe) return
    setTogglingFav(true)
    const newValue = !recipe.is_favorite
    const { error } = await db.from('recipes').update({ is_favorite: newValue }).eq('id', recipe.id)
    if (error) {
      showToast('Opslaan mislukt')
    } else {
      setRecipe({ ...recipe, is_favorite: newValue })
      showToast(newValue ? 'Toegevoegd aan favorieten' : 'Verwijderd uit favorieten')
    }
    setTogglingFav(false)
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

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <h1 className="detail-title" style={{ margin: 0, flex: 1 }}>{recipe.title}</h1>
        <button
          onClick={handleToggleFavorite}
          disabled={togglingFav}
          aria-label="Favoriet"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0, marginTop: 4 }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24"
            fill={recipe.is_favorite ? '#E8651A' : 'none'}
            stroke={recipe.is_favorite ? '#E8651A' : 'currentColor'}
            strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

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
