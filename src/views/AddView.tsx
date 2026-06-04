import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Spinner from '../components/Spinner'
import { importYouTube, importText, importPhoto } from '../lib/imports'
import { SourceType } from '../lib/types'

type Tab = 'link' | 'foto' | 'tekst' | 'handmatig'

const TABS: { id: Tab; label: string }[] = [
  { id: 'link', label: '🔗 Link' },
  { id: 'foto', label: '📷 Foto' },
  { id: 'tekst', label: '📝 Tekst' },
  { id: 'handmatig', label: '✏️ Handmatig' },
]

interface RecipeFormData {
  title: string
  source_type: SourceType
  source_url: string
  image_url: string
  cuisine: string
  tags: string
  prep_time: string
  servings: string
  ingredients: string
  instructions: string
  notes: string
}

const EMPTY_FORM: RecipeFormData = {
  title: '',
  source_type: 'overig',
  source_url: '',
  image_url: '',
  cuisine: '',
  tags: '',
  prep_time: '',
  servings: '',
  ingredients: '',
  instructions: '',
  notes: '',
}

export default function AddView() {
  const { db, config, showToast } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('link')
  const [form, setForm] = useState<RecipeFormData>(EMPTY_FORM)
  const [linkInput, setLinkInput] = useState('')
  const [textInput, setTextInput] = useState('')
  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  function setField(field: keyof RecipeFormData, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleImportLink() {
    if (!linkInput.trim()) return
    setImporting(true)
    try {
      const data = await importYouTube(linkInput.trim())
      setForm({
        ...EMPTY_FORM,
        ...(data as Partial<RecipeFormData>),
        source_url: linkInput.trim(),
        source_type: 'youtube',
        tags: (data.tags as string[] | undefined)?.join(', ') ?? '',
        prep_time: String(data.prep_time ?? ''),
        servings: String(data.servings ?? ''),
      })
      setShowForm(true)
    } catch {
      showToast('Import mislukt')
    } finally {
      setImporting(false)
    }
  }

  async function handleImportText() {
    if (!textInput.trim()) return
    setImporting(true)
    try {
      const data = await importText(textInput.trim(), config?.netlifyUrl)
      setForm({
        ...EMPTY_FORM,
        ...(data as Partial<RecipeFormData>),
        tags: (data.tags as string[] | undefined)?.join(', ') ?? '',
        prep_time: String(data.prep_time ?? ''),
        servings: String(data.servings ?? ''),
      })
      setShowForm(true)
    } catch {
      showToast('Import mislukt')
    } finally {
      setImporting(false)
    }
  }

  async function handleImportPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const data = await importPhoto(file, config?.netlifyUrl)
      setForm({
        ...EMPTY_FORM,
        ...(data as Partial<RecipeFormData>),
        tags: (data.tags as string[] | undefined)?.join(', ') ?? '',
        prep_time: String(data.prep_time ?? ''),
        servings: String(data.servings ?? ''),
      })
      setShowForm(true)
    } catch {
      showToast('Import mislukt')
    } finally {
      setImporting(false)
    }
  }

  async function handleSave() {
    if (!db || !form.title.trim()) return
    setSaving(true)
    try {
      const { error } = await db.from('recipes').insert({
        title: form.title.trim(),
        source_type: form.source_type,
        source_url: form.source_url || null,
        image_url: form.image_url || null,
        cuisine: form.cuisine || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        prep_time: form.prep_time ? parseInt(form.prep_time) : null,
        servings: form.servings ? parseInt(form.servings) : null,
        ingredients: form.ingredients,
        instructions: form.instructions,
        notes: form.notes || null,
      })
      if (error) throw error
      showToast('Recept opgeslagen!')
      navigate('/recipes')
    } catch {
      showToast('Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="view-header">
        <h1>Recept toevoegen</h1>
      </div>

      <div className="import-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`import-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => { setTab(t.id); setShowForm(t.id === 'handmatig') }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'link' && (
        <div>
          <div className="form-group">
            <label>YouTube-link</label>
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={linkInput}
              onChange={e => setLinkInput(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleImportLink} disabled={importing || !linkInput.trim()}>
            {importing ? <Spinner size={18} borderWidth={2} /> : 'Importeren'}
          </button>
        </div>
      )}

      {tab === 'foto' && (
        <div>
          <label htmlFor="photo-input" className="photo-upload">
            <p>Kies een foto van je recept</p>
            <small>Foto van een kookboek of handgeschreven recept</small>
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImportPhoto}
            />
          </label>
          {importing && <div className="loading-center mt-16"><Spinner /></div>}
        </div>
      )}

      {tab === 'tekst' && (
        <div>
          <div className="form-group">
            <label>Recepttekst</label>
            <textarea
              placeholder="Plak hier de recepttekst..."
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              style={{ minHeight: 160 }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleImportText} disabled={importing || !textInput.trim()}>
            {importing ? <Spinner size={18} borderWidth={2} /> : 'Analyseren'}
          </button>
        </div>
      )}

      {(showForm || tab === 'handmatig') && (
        <div style={{ marginTop: 24 }}>
          <div className="divider" />
          <h2 style={{ marginBottom: 16 }}>Recept details</h2>

          <div className="form-group">
            <label>Titel *</label>
            <input type="text" value={form.title} onChange={e => setField('title', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Keuken</label>
              <input type="text" value={form.cuisine} onChange={e => setField('cuisine', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Tags (komma-gescheiden)</label>
              <input type="text" value={form.tags} onChange={e => setField('tags', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Bereidingstijd (min)</label>
              <input type="number" value={form.prep_time} onChange={e => setField('prep_time', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Personen</label>
              <input type="number" value={form.servings} onChange={e => setField('servings', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Ingrediënten</label>
            <textarea value={form.ingredients} onChange={e => setField('ingredients', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Bereidingswijze</label>
            <textarea value={form.instructions} onChange={e => setField('instructions', e.target.value)} style={{ minHeight: 140 }} />
          </div>
          <div className="form-group">
            <label>Notities</label>
            <textarea value={form.notes} onChange={e => setField('notes', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Afbeelding URL</label>
            <input type="url" value={form.image_url} onChange={e => setField('image_url', e.target.value)} />
          </div>

          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.title.trim() || !db}>
            {saving ? <Spinner size={18} borderWidth={2} /> : 'Recept opslaan'}
          </button>
        </div>
      )}
    </div>
  )
}
