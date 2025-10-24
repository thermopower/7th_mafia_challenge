export type FortuneType = 'general' | 'wealth' | 'love' | 'health' | 'job'

export interface FortuneCardData {
  type: FortuneType
  emoji: string
  label: string
  content: string
}
