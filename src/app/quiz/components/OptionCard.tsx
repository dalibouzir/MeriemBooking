'use client'

import { motion } from 'motion/react'
import type { QuizOption } from '../types'

interface OptionCardProps {
  option: QuizOption
  selected: boolean
  onSelect: (option: QuizOption) => void
}

export default function OptionCard({ option, selected, onSelect }: OptionCardProps) {
  return (
    <motion.button
      type="button"
      className={`quiz-option-card${selected ? ' is-selected' : ''}`}
      onClick={() => onSelect(option)}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeInOut' }}
    >
      <span className="quiz-option-copy">{option.label}</span>
      <span className="quiz-option-icon" aria-hidden="true">{option.icon}</span>
    </motion.button>
  )
}
