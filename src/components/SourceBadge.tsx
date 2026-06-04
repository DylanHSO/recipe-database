import { SourceType } from '../lib/types'

const LABELS: Record<SourceType, string> = {
  youtube: 'YouTube',
  claude: 'AI',
  kookboek: 'Kookboek',
  overig: 'Overig',
}

export default function SourceBadge({ type }: { type: SourceType }) {
  return (
    <span className={`source-badge source-${type}`}>{LABELS[type]}</span>
  )
}
