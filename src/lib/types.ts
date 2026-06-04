export type SourceType = 'youtube' | 'claude' | 'kookboek' | 'overig'

export interface Recipe {
  id: string
  title: string
  source_type: SourceType
  source_url?: string
  image_url?: string
  cuisine?: string
  tags: string[]
  prep_time?: number
  servings?: number
  ingredients: string
  instructions: string
  notes?: string
  created_at: string
}

export interface AppConfig {
  supabaseUrl: string
  supabaseKey: string
  netlifyUrl?: string
}
