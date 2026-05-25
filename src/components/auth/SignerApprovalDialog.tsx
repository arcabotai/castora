import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useOpenSignerApproval } from "@/providers/OpenSignerApprovalProvider"
import axios from "axios"
import { useEffect, useState } from "react"
import { isMobile } from "react-device-detect"
import QRCode from "react-qr-code"
import { usePrivy } from '@privy-io/react-auth'
import { toast } from "sonner"
import { useQueryClient } from "react-query"

export const SignerApprovalDialog: React.FC = (props) => {
  const { openSignerApproval, setOpenSignerApproval } = useOpenSignerApproval()
  const { getAccessToken } = usePrivy()
  const queryClient = useQueryClient()

  const [proposedSignerUUID, setProposedSignerUUID] = useState<string>("")
  const [signerApprovalUrl, setSignerApprovalUrl] = useState<string>("")
  const [poolingActive, setPoolingActive] = useState(false)

  const initiateVerification = async () => {
    const localStorageSignerUUID = localStorage.getItem('unapproved-signerUUID')
    const localStorageApprovalURL = localStorage.getItem('unapproved-approvalURL')

    if (!!localStorageSignerUUID && !!localStorageApprovalURL) {
      setProposedSignerUUID(localStorageSignerUUID)
      setSignerApprovalUrl(localStorageApprovalURL)
      return
    }

    toast.error('Please connect your Farcaster account with Sign in with Neynar from onboarding/settings.')
    setOpenSignerApproval(false)
  }

  const waitForSignerApproval = async (signerUUID: string) => {
    let retries = 0;

    // give up after 180 seconds
    while (retries < 180) {
      retries++;

      const accessToken = await getAccessToken()

      try {
        const response = await axios.post(`/api/account/signer-approval`,
          {
            signerUUID: signerUUID,
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        )

        // If we get here, the request was successful
        queryClient.invalidateQueries('supercastUserState')
        localStorage.removeItem('unapproved-signerUUID')
        localStorage.removeItem('unapproved-approvalURL')
        setOpenSignerApproval(false) // Close dialog on success
        return // Exit on success
      } catch (error) {
        // Continue polling on error
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`giving up after ${retries} seconds`)
    setOpenSignerApproval(false) // Close dialog after max retries
  }

  useEffect(() => {
    if (!!proposedSignerUUID) {
      waitForSignerApproval(proposedSignerUUID).catch((error) => {
        console.error('Error in waitForSignerApproval:', error)
        toast.error('Error checking signer approval status')
        setOpenSignerApproval(false)
      })
    }
  }, [proposedSignerUUID])

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      setPoolingActive(true)
    }
  }

  useEffect(() => {
    if (poolingActive && openSignerApproval) {
      const unapprovedSignerUUID = localStorage.getItem('unapproved-signerUUID')
      if (!!unapprovedSignerUUID) {
        waitForSignerApproval(unapprovedSignerUUID).catch((error) => {
          console.error('Error in waitForSignerApproval:', error)
          toast.error('Error checking signer approval status')
          setOpenSignerApproval(false)
        })
      } else {
        toast.error('No signer UUID found')
        setOpenSignerApproval(false)
      }
    }
  }, [poolingActive])

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (openSignerApproval) {
      initiateVerification()
    }
  }, [openSignerApproval])

  useEffect(() => {
    if (isMobile && signerApprovalUrl) {
      window.location.href = signerApprovalUrl
    } else if (isMobile && !signerApprovalUrl) {
      toast.error('Connect your Farcaster account with Sign in with Neynar from onboarding/settings.')
      setOpenSignerApproval(false)
    }
  }, [signerApprovalUrl, isMobile])

  const content = (
    <>
      <DialogHeader>
        <DialogTitle>One more step</DialogTitle>
        <DialogDescription>
          <p>Castora needs an approved Farcaster signer before it can post on your behalf.</p>
          <p>Connect your account with Sign in with Neynar from onboarding or settings.</p>
        </DialogDescription>
      </DialogHeader>
      {signerApprovalUrl ? (
        <QRCode
          value={signerApprovalUrl}
          className='mx-auto mt-4 p-2 bg-white rounded-lg border-2 border-black'
        />
      ) : (
        <div className='flex flex-row justify-center py-6'>
          <p className='text-gray-400 text-xs'>opening a connection...</p>
        </div>
      )}
    </>
  )

  if (isMobile) {
    return (
      <Drawer open={openSignerApproval} onOpenChange={setOpenSignerApproval}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>One more step</DrawerTitle>
            <DrawerDescription>
              <p>Castora currently doesn't have permissions to post on your behalf.</p>
              <p>Please approve a connection in Warpcast by scanning this QR code.</p>
            </DrawerDescription>
          </DrawerHeader>
          {signerApprovalUrl ? (
            <div className="px-4 pb-8">
              <QRCode
                value={signerApprovalUrl}
                className='mx-auto mt-4 p-2 bg-white rounded-lg border-2 border-black'
              />
            </div>
          ) : (
            <div className='flex flex-row justify-center py-6'>
              <p className='text-gray-400 text-xs'>opening a connection...</p>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={openSignerApproval} onOpenChange={setOpenSignerApproval}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        {content}
      </DialogContent>
    </Dialog>
  )
}
