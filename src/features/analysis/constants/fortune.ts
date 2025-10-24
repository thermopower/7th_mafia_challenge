import type { FortuneType } from '../lib/types'

export const FORTUNE_CONFIG: Record<
  FortuneType,
  { emoji: string; label: string }
> = {
  general: { emoji: '🌟', label: '총운' },
  wealth: { emoji: '💰', label: '재물운' },
  love: { emoji: '💕', label: '애정운' },
  health: { emoji: '🏥', label: '건강운' },
  job: { emoji: '💼', label: '직업운' },
}

export const FORTUNE_ORDER: FortuneType[] = [
  'general',
  'wealth',
  'love',
  'health',
  'job',
]
