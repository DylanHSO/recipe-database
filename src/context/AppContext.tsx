import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { AppConfig } from '../lib/types'

interface AppContextValue {
  config: AppConfig | null
  db: SupabaseClient | null
  updateConfig: (cfg: AppConfig) => void
  showToast: (msg: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [db, setDb] = useState<SupabaseClient | null>(null)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('recipeCfg')
    if (stored) {
      try {
        const cfg = JSON.parse(stored) as AppConfig
        if (cfg.supabaseUrl && cfg.supabaseKey) {
          setConfig(cfg)
          setDb(createClient(cfg.supabaseUrl, cfg.supabaseKey))
        }
      } catch {
        // ignore malformed stored config
      }
    }
  }, [])

  const updateConfig = useCallback((cfg: AppConfig) => {
    localStorage.setItem('recipeCfg', JSON.stringify(cfg))
    setConfig(cfg)
    setDb(createClient(cfg.supabaseUrl, cfg.supabaseKey))
  }, [])

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2600)
  }, [])

  return (
    <AppContext.Provider value={{ config, db, updateConfig, showToast }}>
      {children}
      <div className={`toast${toastVisible ? ' show' : ''}`}>{toastMsg}</div>
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
