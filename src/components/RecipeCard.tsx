import { useNavigate } from 'react-router-dom'
import { Recipe } from '../lib/types'

interface Props {
  recipe: Recipe
  onToggleFavorite?: (id: string, isFavorite: boolean) => void
}

export default function RecipeCard({ recipe, onToggleFavorite }: Props) {
  const navigate = useNavigate()

  function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    onToggleFavorite?.(recipe.id, !recipe.is_favorite)
  }

  return (
    <div className="recipe-card" onClick={() => navigate(`/recipe/${recipe.id}`)}>
      <div style={{ position: 'relative' }}>
        {recipe.image_url ? (
          <img className="recipe-card-thumb" src={recipe.image_url} alt={recipe.title} loading="lazy" />
        ) : (
          <div className="recipe-card-thumb-placeholder">
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {onToggleFavorite && (
          <button className="recipe-card-favorite" onClick={handleFavorite} aria-label="Favoriet">
            <svg width="18" height="18" viewBox="0 0 24 24"
              fill={recipe.is_favorite ? '#E8651A' : 'none'}
              stroke={recipe.is_favorite ? '#E8651A' : 'currentColor'}
              strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}
      </div>
      <div className="recipe-card-body">
        <div className="recipe-card-title">{recipe.title}</div>
        <div className="recipe-card-meta">
          {[recipe.cuisine, recipe.prep_time ? `${recipe.prep_time} min` : null]
            .filter(Boolean)
            .join(' · ')}
        </div>
        {recipe.tags.length > 0 && (
          <div className="tags">
            {recipe.tags.slice(0, 2).map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
