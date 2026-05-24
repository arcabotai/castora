import { useState, useCallback } from 'react'
import ReactConfetti from 'react-confetti'
import { useWindowSize } from 'react-use'

export const useConfetti = () => {
  const [showConfetti, setShowConfetti] = useState(false)
  const { width, height } = useWindowSize()

  const triggerConfetti = useCallback((colors: string[], duration = 5000) => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), duration)
  }, [])

  const ConfettiComponent = useCallback(
    ({ colors }: { colors: string[] }) =>
      showConfetti ? (
        <ReactConfetti
          width={width}
          height={height}
          colors={colors}
          recycle={false}
          numberOfPieces={2500}

        />
      ) : null,
    [showConfetti, width, height]
  )

  return { triggerConfetti, ConfettiComponent }
}