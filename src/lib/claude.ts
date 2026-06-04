import { AppConfig } from './types'

const BASE_URL = (netlifyUrl?: string) =>
  netlifyUrl ? netlifyUrl.replace(/\/$/, '') : ''

export async function callClaude(
  payload: Record<string, unknown>,
  netlifyUrl?: string,
): Promise<string> {
  const res = await fetch(`${BASE_URL(netlifyUrl)}/.netlify/functions/claude`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Claude API error ${res.status}: ${text}`)
  }

  const data = (await res.json()) as { content?: Array<{ text?: string }> }
  return data.content?.[0]?.text ?? ''
}

export async function suggestRecipe(
  query: string,
  config: AppConfig,
): Promise<{ title: string; reason: string } | null> {
  const text = await callClaude(
    {
      messages: [
        {
          role: 'user',
          content: `Stel één recept voor dat past bij: "${query}". Geef een JSON-object terug met "title" (recept naam) en "reason" (één zin waarom). Alleen JSON, geen markdown.`,
        },
      ],
    },
    config.netlifyUrl,
  )

  try {
    const parsed = JSON.parse(text) as { title?: string; reason?: string }
    if (parsed.title && parsed.reason) {
      return { title: parsed.title, reason: parsed.reason }
    }
  } catch {
    // not valid JSON
  }
  return null
}
