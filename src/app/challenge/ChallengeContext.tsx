'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// Challenge stats type
export interface ChallengeStats {
  maxSeats: number
  confirmedCount: number
  waitlistCount: number
  remainingSeats: number
  isFull: boolean
}

// Modal state type
type ModalState = 'closed' | 'form' | 'loading' | 'success' | 'waitlist' | 'error'

// Registration result type
interface RegistrationResult {
  meetLink?: string
  registrationId?: string
  startsAt?: string
  durationMinutes?: number
}

// Context type
interface ChallengeContextType {
  // Stats
  stats: ChallengeStats
  updateStats: (newStats: ChallengeStats) => void
  
  // Modal
  modalState: ModalState
  openModal: () => void
  closeModal: () => void
  setModalState: (state: ModalState) => void
  
  // Registration result
  registrationResult: RegistrationResult | null
  setRegistrationResult: (result: RegistrationResult | null) => void
  
  // Error
  errorMessage: string
  setErrorMessage: (msg: string) => void
  
  // Scroll helpers
  scrollToDetails: () => void
  scrollToTop: () => void
}

const ChallengeContext = createContext<ChallengeContextType | null>(null)

export function useChallengeContext() {
  const ctx = useContext(ChallengeContext)
  if (!ctx) {
    throw new Error('useChallengeContext must be used within ChallengeProvider')
  }
  return ctx
}

interface ChallengeProviderProps {
  children: ReactNode
  initialStats: ChallengeStats
}

export function ChallengeProvider({ children, initialStats }: ChallengeProviderProps) {
  const [stats, setStats] = useState<ChallengeStats>(initialStats)
  const [modalState, setModalState] = useState<ModalState>('closed')
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const updateStats = useCallback((newStats: ChallengeStats) => {
    setStats(newStats)
  }, [])

  const openModal = useCallback(() => {
    setModalState('form')
  }, [])

  const closeModal = useCallback(() => {
    setModalState('closed')
    // Reset states when closing
    setTimeout(() => {
      setRegistrationResult(null)
      setErrorMessage('')
    }, 300)
  }, [])

  const scrollToDetails = useCallback(() => {
    const el = document.getElementById('challenge-benefits')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <ChallengeContext.Provider
      value={{
        stats,
        updateStats,
        modalState,
        openModal,
        closeModal,
        setModalState,
        registrationResult,
        setRegistrationResult,
        errorMessage,
        setErrorMessage,
        scrollToDetails,
        scrollToTop,
      }}
    >
      {children}
    </ChallengeContext.Provider>
  )
}
