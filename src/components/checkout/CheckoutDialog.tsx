'use client'

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader } from "@/components/ui/drawer"
import { useCheckoutDialog } from "@/hooks/useCheckoutDialog"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider"
import { HOST_URL } from "@/utils/hostURL"
import { PAYMENT_METHOD, PRODUCT_TYPE } from "@prisma/client"
import { usePrivy } from "@privy-io/react-auth"
import axios from "axios"
import { ArrowLeft, CreditCard, Loader2, Minus, Plus, Wallet } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "../ui/button"

import { DaimoPayProvider, useDaimoPayStatus, usePayContext } from "@daimo/pay"
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useQueryClient } from "react-query"

const MEMBERSHIP_PRICE_USD = Number(process.env.NEXT_PUBLIC_MEMBERSHIP_PRICE_USD)
const REGISTRATION_PRICE_USD = Number(process.env.NEXT_PUBLIC_REGISTRATION_PRICE_USD)
const STORAGE_PRICE_USD = Number(process.env.NEXT_PUBLIC_STORAGE_PRICE_USD)

const PRODUCT_PRICE_USD = {
  [PRODUCT_TYPE.MEMBERSHIP]: MEMBERSHIP_PRICE_USD,
  [PRODUCT_TYPE.REGISTRATION]: REGISTRATION_PRICE_USD,
  [PRODUCT_TYPE.STORAGE]: STORAGE_PRICE_USD,
}

const PRODUCT_TITLE = {
  [PRODUCT_TYPE.MEMBERSHIP]: 'Monthly membership',
  [PRODUCT_TYPE.REGISTRATION]: 'Farcaster registration',
  [PRODUCT_TYPE.STORAGE]: 'Buy more storage',
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export function CheckoutDialog() {
  return (
    <DaimoPayProvider>
      <CheckoutDialogContent />
    </DaimoPayProvider>
  );
}

function CheckoutDialogContent() {
  const { getAccessToken } = usePrivy()
  const { supercastUserState } = useSupercastUserState()
  const { isOpen, productType, setIsOpen } = useCheckoutDialog()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [loadingSession, setLoadingSession] = useState<PAYMENT_METHOD | null>(null)
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [stripeOptions, setStripeOptions] = useState<any>(null)
  const payContext = usePayContext();

  const queryClient = useQueryClient()

  const [isStripeCheckoutComplete, setIsStripeCheckoutComplete] = useState(false)

  const title = PRODUCT_TITLE[productType]
  const registrationPrice = REGISTRATION_PRICE_USD

  const decreaseQuantity = () => setQuantity((prev) => Math.max(1, prev - 1))
  const increaseQuantity = () => setQuantity((prev) => Math.min(120, prev + 1))
  const purchaseValueUsd = quantity * PRODUCT_PRICE_USD[productType]

  const handleBack = () => {
    if (!!stripeOptions) {
      setStripeOptions(null)
      setShowPaymentOptions(true)
    } else if (showPaymentOptions) {
      setShowPaymentOptions(false)
    }
  }

  const handleSelectPaymentMethod = async (method: PAYMENT_METHOD) => {
    setLoadingSession(method)

    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/payment-session`, {
      productType,
      productQuantity: quantity,
      paymentMethod: method,
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    }).then((response) => {
      if (method === PAYMENT_METHOD.STRIPE) {
        setStripeOptions({
          clientSecret: response.data.clientSecret
        })
      } else if (method === PAYMENT_METHOD.DAIMO) {
        if (payContext == null) {
          toast.error("Could not create a checkout. Contact support")
          return
        }
        payContext.setCustomTheme({
          "--ck-font-weight": "400",
          "--ck-border-radius": "8px",
          "--ck-modal-heading-font-weight": "500",
          "--ck-qr-border-radius": "8px",
          "--ck-primary-button-font-weight": "600",
          "--ck-primary-button-border-radius": "8px",
          "--ck-primary-button-color": "#FFF",
          "--ck-primary-button-background": "#061223",
          "--ck-primary-button-box-shadow": "0px 0px 0px 1px #1f2937",
          "--ck-primary-button-hover-color": "#FFF",
          "--ck-primary-button-hover-background": "#091b34",
          "--ck-primary-button-hover-box-shadow": "0px 0px 0px 1px #1f2937",
          "--ck-primary-button-active-color": "#FFF",
          "--ck-primary-button-active-background": "#0b203d",
          "--ck-primary-button-active-box-shadow": "0px 0px 0px 1px #1f2937",
          "--ck-primary-button-active-border-radius": "8px",
          "--ck-secondary-button-font-weight": "500",
          "--ck-tertiary-button-font-weight": "500",
          "--ck-modal-box-shadow": "0px 0px 0px 1px #1f2937",

          // Everything below is from the Midnight theme
          "--ck-secondary-button-border-radius": "8px",
          "--ck-secondary-button-color": "#ffffff",
          "--ck-secondary-button-background": "#363638",
          "--ck-secondary-button-box-shadow":
            "inset 0 0 0 1px rgba(255, 255, 255, 0.05)",

          "--ck-secondary-button-hover-background": "#3c3c3e",

          "--ck-overlay-background": "rgba(0,0,0,0.2)",

          "--ck-focus-color": "#1A88F8",
          "--ck-body-color": "#ffffff",
          "--ck-body-color-muted": "#8B8F97",
          "--ck-body-color-muted-hover": "#ffffff",
          "--ck-body-background": "#030912",
          "--ck-body-background-transparent": "rgba(31, 32, 35, 0)",
          "--ck-body-background-secondary": "#313235",
          "--ck-body-background-secondary-hover-background": "#e0e4eb",
          "--ck-body-background-secondary-hover-outline": "rgba(255, 255, 255, 0.02)",
          "--ck-body-background-tertiary": "#313235",
          "--ck-tertiary-border-radius": "8px",
          "--ck-tertiary-box-shadow": "inset 0 0 0 1px rgba(255, 255, 255, 0.02)",

          "--ck-body-action-color": "#8B8F97",
          "--ck-body-divider": "rgba(255,255,255,0.1)",
          "--ck-body-color-danger": "#FF4E4E",
          "--ck-body-color-valid": "#32D74B",

          "--ck-body-disclaimer-background": "#2B2D31",
          "--ck-body-disclaimer-box-shadow": "none",
          "--ck-body-disclaimer-color": "#808183",
          "--ck-body-disclaimer-link-color": "#AAABAD",
          "--ck-body-disclaimer-link-hover-color": "#ffffff",

          "--ck-copytoclipboard-stroke": "#CCCCCC",

          "--ck-tooltip-background": "#1F2023",
          "--ck-tooltip-background-secondary": "#1F2023",
          "--ck-tooltip-color": "#ffffff",
          "--ck-tooltip-shadow":
            " 0 0 0 1px rgba(255, 255, 255, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.02)",

          "--ck-spinner-color": "var(--ck-focus-color)",

          "--ck-dropdown-button-color": "#6C7381",
          "--ck-dropdown-button-box-shadow":
            "inset 0 0 0 1px rgba(255, 255, 255, 0.05)",
          "--ck-dropdown-button-background": "#313235",

          "--ck-dropdown-pending-color": "#8B8F97",
          "--ck-dropdown-active-color": "#FFF",
          "--ck-dropdown-active-static-color": "#FFF",
          "--ck-dropdown-active-background": "rgba(255, 255, 255, 0.07)",
          "--ck-dropdown-color": "#8B8F97",
          "--ck-dropdown-background": "#313235",
          "--ck-dropdown-box-shadow": "inset 0 0 0 1px rgba(255, 255, 255, 0.03)",
          "--ck-dropdown-border-radius": "8px",

          "--ck-alert-color": "#8B8F97",
          "--ck-alert-background": "#404145",
          "--ck-alert-box-shadow": "inset 0 0 0 1px rgba(255, 255, 255, 0.02)",

          "--ck-qr-dot-color": "#ffffff",
          "--ck-qr-border-color": "rgba(255,255,255,0.1)",

          "--ck-recent-badge-border-radius": "32px",
        })
        payContext.paymentState.setPayId(response.data.daimoPayId);
        payContext.showPayment({ closeOnSuccess: true });
      }
    }).catch((error) => {
      toast.error("Could not create a checkout. Contact support")
    }).finally(() => {
      setLoadingSession(null)
    })
  }

  const handleCheckoutComplete = () => {
    if (productType === PRODUCT_TYPE.REGISTRATION) {
      queryClient.invalidateQueries({ queryKey: ['registrationStatus'] })

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['registrationStatus'] })
      }, 2000)
    }

    if (productType === PRODUCT_TYPE.MEMBERSHIP) {
      queryClient.invalidateQueries({ queryKey: ['supercastUserState'] })
      queryClient.invalidateQueries({ queryKey: ['billingData'] })
      queryClient.invalidateQueries({ queryKey: ['superMembers'] })

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['supercastUserState'] })
      }, 2000)

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['billingData'] })
      }, 2000)

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['superMembers'] })
      }, 2000)
    }

    if (productType === PRODUCT_TYPE.STORAGE) {
      queryClient.invalidateQueries({ queryKey: ['storageData'] })

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['storageData'] })
      }, 2000)
    }

    setIsStripeCheckoutComplete(true)
  }

  // On successful Daimo payment, call onCheckoutComplete
  const payStatus = useDaimoPayStatus();
  useEffect(() => {
    if (payStatus == null) return;
    console.log(`Daimo Pay status: ${JSON.stringify(payStatus)}`);
    if (payStatus.status === "payment_completed") handleCheckoutComplete();
  }, [payStatus])

  useEffect(() => {
    if (productType === PRODUCT_TYPE.MEMBERSHIP) {
      setQuantity(12)
    } else {
      setQuantity(1)
    }
  }, [productType])

  const paymentSummary = (
    <div className="mb-6 text-center">
      <span className="text-sm font-medium text-gray-500">Total amount</span>
      <div className="text-xl font-semibold">
        ${(productType === PRODUCT_TYPE.MEMBERSHIP || productType === PRODUCT_TYPE.STORAGE) ? purchaseValueUsd.toFixed(2) : registrationPrice}
      </div>
    </div>
  )

  const paymentOptions = (
    <div id="payment-options" className="space-y-4">
      {paymentSummary}
      <Button
        id="credit-card"
        variant="outline"
        className="w-full flex justify-between items-center"
        onClick={() => handleSelectPaymentMethod(PAYMENT_METHOD.STRIPE)}
        disabled={loadingSession !== null}
      >
        <div className="flex items-center gap-2">
          {loadingSession === PAYMENT_METHOD.STRIPE ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          <span>Credit Card</span>
        </div>
        <span className="text-xs text-gray-500">Stripe</span>
      </Button>

      <Button
        id="external-wallet"
        variant="outline"
        className="w-full flex justify-between items-center"
        onClick={() => handleSelectPaymentMethod(PAYMENT_METHOD.DAIMO)}
        disabled={loadingSession !== null}
      >
        <div className="flex items-center gap-2">
          {loadingSession === PAYMENT_METHOD.DAIMO ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
          <span>Crypto</span>
        </div>
        <span className="text-xs text-gray-500">Daimo Pay</span>
      </Button>

      <Button
        id="super-wallet"
        variant="outline"
        className="w-full flex justify-between items-center"
        disabled
      >
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          <span>Castora Wallet</span>
        </div>
        <span className="text-xs text-gray-500">Coming soon</span>
      </Button>
    </div>
  )

  const quantityContent = (
    <div className="flex flex-col items-center justify-center space-y-6 py-8">
      <div className="flex items-center justify-between w-full mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={decreaseQuantity}
          disabled={quantity <= 1}
          aria-label="Decrease quantity"
          className="dark:border-gray-200 dark:bg-white dark:hover:bg-gray-100 dark:hover:text-gray-900 dark:text-black"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="text-center flex flex-row items-center gap-x-2">
          <div className="text-4xl font-bold">{quantity}</div>
          <div className="text-sm text-gray-500">
            {productType === PRODUCT_TYPE.MEMBERSHIP ? "month" : "unit"}{quantity !== 1 ? "s" : ""}
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={increaseQuantity}
          disabled={quantity >= 120}
          aria-label="Increase quantity"
          className="dark:border-gray-200 dark:bg-white dark:hover:bg-gray-100 dark:hover:text-gray-900 dark:text-black"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button
        className="w-full"
        onClick={() => setShowPaymentOptions(true)}
      >
        Pay ${purchaseValueUsd.toFixed(2)}
      </Button>
    </div>
  )

  const registrationContent = (
    <div className="flex flex-col items-center justify-center space-y-6 py-8">
      <div className="text-center">
        <div className="text-4xl font-bold mb-2">${registrationPrice}</div>
        <div className="text-gray-500">One-time payment</div>
      </div>
      <Button
        className="w-full"
        onClick={() => setShowPaymentOptions(true)}
      >
        Buy now
      </Button>
    </div>
  )

  const checkoutContent = (
    <div id="checkout-content" className="space-y-4 max-h-[500px] overflow-y-auto">
      <Button
        id="back"
        variant="ghost"
        className="mb-4 px-2 hover:bg-transparent"
        onClick={handleBack}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        <span>Back</span>
      </Button>
      <div className="text-center text-gray-500">
        {!!stripeOptions &&
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ ...stripeOptions, onComplete: handleCheckoutComplete }}>
            <EmbeddedCheckout />
            {isStripeCheckoutComplete &&
              <Button
                className="w-full mt-4"
                onClick={() => {
                  setIsOpen(false)
                  setIsStripeCheckoutComplete(false)
                  setStripeOptions(null)
                  handleCheckoutComplete()
                }}
              >
                Close
              </Button>}
          </EmbeddedCheckoutProvider>
        }
      </div>
    </div>
  )

  const getContent = () => {
    if (productType === PRODUCT_TYPE.REGISTRATION) {
      if (showPaymentOptions) {
        if (!!stripeOptions) {
          return checkoutContent
        }
        return (
          <>
            <Button
              id="back"
              variant="ghost"
              className="mb-4 px-2 hover:bg-transparent"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Back</span>
            </Button>
            {paymentOptions}
          </>
        )
      }
      return registrationContent
    }

    // Subscription flow
    if (showPaymentOptions) {
      if (!!stripeOptions) {
        return checkoutContent
      }
      return (
        <>
          <Button
            id="back"
            variant="ghost"
            className="mb-4 px-2 hover:bg-transparent"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Back</span>
          </Button>
          {paymentOptions}
        </>
      )
    }
    return quantityContent
  }

  const content =
    <div className="">
      {getContent()}
    </div>

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <h2 className="text-lg font-semibold mb-4">{title}</h2>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent>
        <DrawerHeader>
          <h2 className="text-lg font-semibold">{title}</h2>
        </DrawerHeader>
        <div className="px-4">
          {content}
        </div>
        <DrawerFooter>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
