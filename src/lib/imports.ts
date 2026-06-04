import { callClaude } from './claude'

export async function importYouTube(url: string): Promise<Record<string, unknown>> {
  // YouTube oEmbed to get title + thumbnail
  const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
  const res = await fetch(oembed)
  let title = ''
  let imageUrl = ''
  if (res.ok) {
    const data = (await res.json()) as { title?: string; thumbnail_url?: string }
    title = data.title ?? ''
    imageUrl = data.thumbnail_url ?? ''
  }

  return { title, image_url: imageUrl, source_type: 'youtube', source_url: url }
}

export async function importText(
  text: string,
  netlifyUrl?: string,
): Promise<Record<string, unknown>> {
  const prompt = `Analyseer de volgende recepttekst en geef een JSON-object terug met:
title (string), cuisine (string of null), tags (string[]), prep_time (minuten als getal of null), servings (getal of null), ingredients (string, genummerde of met bullet points per regel), instructions (string, genummerde stappen per regel), notes (string of null).
Alleen JSON, geen markdown.

Tekst:
${text}`

  const response = await callClaude({ messages: [{ role: 'user', content: prompt }] }, netlifyUrl)

  try {
    const parsed = JSON.parse(response) as Record<string, unknown>
    return { ...parsed, source_type: 'overig' }
  } catch {
    return { title: 'Geïmporteerd recept', source_type: 'overig', ingredients: text, instructions: '' }
  }
}

export async function importPhoto(
  file: File,
  netlifyUrl?: string,
): Promise<Record<string, unknown>> {
  const base64 = await fileToBase64(file)
  const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

  const prompt = `Dit is een foto van een recept (pagina uit een kookboek of handgeschreven). Analyseer het en geef een JSON-object terug met:
title (string), cuisine (string of null), tags (string[]), prep_time (minuten als getal of null), servings (getal of null), ingredients (string, ingrediënten per regel), instructions (string, stappen per regel), notes (string of null).
Alleen JSON, geen markdown.`

  const response = await callClaude(
    {
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64.split(',')[1] } },
            { type: 'text', text: prompt },
          ],
        },
      ],
    },
    netlifyUrl,
  )

  try {
    const parsed = JSON.parse(response) as Record<string, unknown>
    return { ...parsed, source_type: 'kookboek' }
  } catch {
    return { title: 'Geïmporteerd recept', source_type: 'kookboek', ingredients: '', instructions: '' }
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
