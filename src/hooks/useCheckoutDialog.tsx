'use client'

import { PRODUCT_TYPE } from '@prisma/client'
import { createContext, useContext, ReactNode, useState } from 'react'

type CheckoutDialogContextType = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  productType: PRODUCT_TYPE | null
  openCheckout: (product: PRODUCT_TYPE) => void
}

const CheckoutDialogContext = createContext<CheckoutDialogContextType | null>(null)

export function CheckoutDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [productType, setProductType] = useState<PRODUCT_TYPE | null>(null)

  const openCheckout = (product: PRODUCT_TYPE) => {
    setProductType(product)
    setIsOpen(true)
  }

  return (
    <CheckoutDialogContext.Provider
      value={{
        isOpen,
        setIsOpen,
        productType,
        openCheckout,
      }}
    >
      {children}
    </CheckoutDialogContext.Provider>
  )
}

export function useCheckoutDialog() {
  const context = useContext(CheckoutDialogContext)
  if (!context) {
    throw new Error('useCheckoutDialog must be used within a CheckoutDialogProvider')
  }
  return context
} 