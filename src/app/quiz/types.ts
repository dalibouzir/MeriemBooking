export type MainTypeKey = 'guide' | 'pleaser' | 'rescuer' | 'independent'

export type ShadowOptionKey = 'A' | 'B' | 'C' | 'D'

export type QuizOption = {
  key: ShadowOptionKey
  label: string
  icon: string
  mainType: MainTypeKey
}

export type QuizQuestion = {
  id: number
  category?: string
  text: string
  options: QuizOption[]
}

export type QuizAnswers = Record<number, QuizOption | null>

export type MainTypeDefinition = {
  key: MainTypeKey
  label: string
  emoji: string
  fullDescriptionHtml: string
}

export type QuizResult = {
  mainType: MainTypeDefinition
  secondaryType: MainTypeDefinition | null
  shadowTypeLabel: string
  normalizedScores: Record<MainTypeKey, number>
}
