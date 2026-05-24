
import { useOpenSignerApproval } from "@/providers/OpenSignerApprovalProvider"
import { HOST_URL } from "@/utils/hostURL"
import axios from "axios"
import { useEffect, useState } from "react"
import { isMobile } from "react-device-detect"
import QRCode from "react-qr-code"
import { usePrivy } from '@privy-io/react-auth'
import { toast } from "sonner"
import { useQueryClient } from "react-query"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"

interface ConnectAccountFormProps {
  onBack: () => void;
}

export default function ConnectAccountForm({
  onBack,
}: ConnectAccountFormProps) {
  const { getAccessToken } = usePrivy()
  const queryClient = useQueryClient()

  const [connectedFid, setConnectedFid] = useState<number>(0)
  const [proposedSignerUUID, setProposedSignerUUID] = useState<string>("")
  const [signerApproved, setSignerApproved] = useState<boolean>(false)
  const [signerApprovalUrl, setSignerApprovalUrl] = useState<string>("")
  const [poolingActive, setPoolingActive] = useState(false)

  const router = useRouter()

  const initiateVerification = async () => {
    const localStorageSignerUUID = localStorage.getItem('unapproved-signerUUID')
    const localStorageApprovalURL = localStorage.getItem('unapproved-approvalURL')

    if (!!localStorageSignerUUID && !!localStorageApprovalURL) {
      setProposedSignerUUID(localStorageSignerUUID)
      setSignerApprovalUrl(localStorageApprovalURL)
      return
    }

    try {
      const accessToken = await getAccessToken()
      const res = await axios.post(`${HOST_URL}/api/account/create-signer`, {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!res.data.signerUUID || !res.data.signerApprovalUrl) {
        toast.error('Invalid response from server')
        return
      }

      localStorage.setItem('unapproved-signerUUID', res.data.signerUUID)
      localStorage.setItem('unapproved-approvalURL', res.data.signerApprovalUrl)
      setProposedSignerUUID(res.data.signerUUID)
      setSignerApprovalUrl(res.data.signerApprovalUrl)
    } catch (error) {
      console.error(error)
      toast.error('Error initiating Farcaster verification')
    }
  }

  const waitForSignerApproval = async (signerUUID: string) => {
    let retries = 0;
    console.log('waiting for signer approval')

    // give up after 180 seconds
    while (retries < 180) {
      retries++;

      console.log("attempt ", retries, " signerUUID", signerUUID)

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
        return // Exit on success
      } catch (error) {
        // Continue polling on error
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`giving up after ${retries} seconds`)
  }

  useEffect(() => {
    if (!!proposedSignerUUID) {
      waitForSignerApproval(proposedSignerUUID).catch((error) => {
        console.error('Error in waitForSignerApproval:', error)
        toast.error('Error checking signer approval status')
      })
    }
  }, [proposedSignerUUID])

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      setPoolingActive(true)
    }
  }

  useEffect(() => {
    if (poolingActive) {
      const unapprovedSignerUUID = localStorage.getItem('unapproved-signerUUID')
      if (!!unapprovedSignerUUID) {
        waitForSignerApproval(unapprovedSignerUUID).catch((error) => {
          console.error('Error in waitForSignerApproval:', error)
          toast.error('Error checking signer approval status')
        })
      } else {
        toast.error('No signer UUID found')
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
    initiateVerification()
  }, [])

  useEffect(() => {
    if (isMobile && signerApprovalUrl) {
      window.location.href = signerApprovalUrl
    } else if (isMobile && !signerApprovalUrl) {
      toast.error('Error forwarding you to Warpcast')
    }
  }, [signerApprovalUrl, isMobile])

  return (
    <div className="flex flex-col items-center justify-center pt-20">
      <h1 className="font-semibold text-2xl tracking-tight mb-2 text-center max-w-xs">Connect your Warpcast account</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-xs text-center leading">
        If you already have a Warpcast account, scan the QR code below to use it in super
      </p>
      <div className="w-full max-w-md">
        <div className="space-y-4 p-4">
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
        </div>
        <Button
          onClick={onBack}
          variant="ghost"
          className="w-full mt-6"
        >
          Go back
        </Button>
      </div>
    </div>
  );
} 