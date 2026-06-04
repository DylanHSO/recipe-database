import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { AppConfig } from '../lib/types'

const SETUP_SQL = `-- Voer dit uit in de Supabase SQL Editor
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'overig',
  source_url TEXT,
  image_url TEXT,
  cuisine TEXT,
  tags TEXT[] DEFAULT '{}',
  prep_time INTEGER,
  servings INTEGER,
  ingredients TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Row Level Security inschakelen
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Iedereen met de anon-key mag lezen en schrijven
CREATE POLICY "Public access" ON recipes FOR ALL USING (true) WITH CHECK (true);`

export default function SettingsView() {
  const { config, updateConfig, showToast } = useApp()
  const [supabaseUrl, setSupabaseUrl] = useState(config?.supabaseUrl ?? '')
  const [supabaseKey, setSupabaseKey] = useState(config?.supabaseKey ?? '')
  const [netlifyUrl, setNetlifyUrl] = useState(config?.netlifyUrl ?? '')
  const [saving, setSaving] = useState(false)

  function handleSave() {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      showToast('Vul URL en API-sleutel in')
      return
    }
    setSaving(true)
    const cfg: AppConfig = {
      supabaseUrl: supabaseUrl.trim(),
      supabaseKey: supabaseKey.trim(),
      netlifyUrl: netlifyUrl.trim() || undefined,
    }
    updateConfig(cfg)
    showToast('Instellingen opgeslagen!')
    setSaving(false)
  }

  function copySQL() {
    navigator.clipboard.writeText(SETUP_SQL).then(() => showToast('SQL gekopieerd!'))
  }

  return (
    <div>
      <div className="view-header">
        <h1>Instellingen</h1>
        <p>Verbind je database</p>
      </div>

      <div className="settings-section">
        <div className="settings-label">Supabase configuratie</div>

        <div className="form-group">
          <label>Project URL</label>
          <input
            type="url"
            placeholder="https://xxxx.supabase.co"
            value={supabaseUrl}
            onChange={e => setSupabaseUrl(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Anon API-sleutel</label>
          <input
            type="text"
            placeholder="eyJhbGci..."
            value={supabaseKey}
            onChange={e => setSupabaseKey(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Netlify URL (voor AI-functies)</label>
          <input
            type="url"
            placeholder="https://jouw-site.netlify.app"
            value={netlifyUrl}
            onChange={e => setNetlifyUrl(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          Opslaan
        </button>
      </div>

      <div className="settings-section">
        <div className="settings-label">Database instellen</div>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>
          Voer dit SQL-script uit in de Supabase SQL Editor om de receptentabel aan te maken.
        </p>
        <div className="code-block">{SETUP_SQL}</div>
        <button className="btn btn-secondary mt-12" onClick={copySQL} style={{ marginTop: 10 }}>
          SQL kopiëren
        </button>
      </div>
    </div>
  )
}
