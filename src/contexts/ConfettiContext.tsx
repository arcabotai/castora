'use client'

import React, { createContext, useState, useContext, useCallback } from 'react'
import ReactConfetti from 'react-confetti'
import { useWindowSize } from 'react-use'

interface ConfettiContextType {
  triggerConfetti: (colors: string[], duration?: number) => void
  ConfettiComponent: React.FC
}

const ConfettiContext = createContext<ConfettiContextType | undefined>(undefined)

export const ConfettiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showConfetti, setShowConfetti] = useState(false)
  const [confettiColors, setConfettiColors] = useState<string[]>([])
  const { width, height } = useWindowSize()

  const triggerConfetti = useCallback((colors: string[], duration = 5000) => {
    setConfettiColors(colors)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), duration)
  }, [])

  const ConfettiComponent: React.FC = () => (
    showConfetti ? (
      <ReactConfetti
        width={width}
        height={height}
        colors={confettiColors}
        recycle={false}
        numberOfPieces={2000}
      />
    ) : null
  )

  return (
    <ConfettiContext.Provider value={{ triggerConfetti, ConfettiComponent }}>
      {children}
    </ConfettiContext.Provider>
  )
}

export const useConfetti = () => {
  const context = useContext(ConfettiContext)
  if (context === undefined) {
    throw new Error('useConfetti must be used within a ConfettiProvider')
  }
  return context
}