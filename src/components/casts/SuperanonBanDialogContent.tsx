import { toast } from "sonner";
import { HOST_URL } from "@/utils/hostURL";
import axios from "axios";
import { isMobile } from "react-device-detect";

import { Button } from "@/components/ui/button"
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

import { useSelectedCast } from "@/providers/SelectedCastProvider";
import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useOpenSignerApproval } from '@/providers/OpenSignerApprovalProvider'
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider";
import { Loader2 } from "lucide-react";
import { useDeletedCast } from "@/providers/DeletedCastsProvider";

interface SuperanonBanDialogContentProps {
  castHash: string
  redirectToHash: string
  setOpenSuperanonBanDialog: (value: boolean) => void
}

export function SuperanonBanDialogContent(props: SuperanonBanDialogContentProps) {

  const { castHash, redirectToHash, setOpenSuperanonBanDialog } = props
  const { deletedCastMap, setDeletedCastMap } = useDeletedCast()

  const { setHash } = useSelectedCast()
  const [loadingSuperanonBan, setLoadingSuperanonBan] = useState(false)

  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken } = usePrivy()
  const { setOpenSignerApproval } = useOpenSignerApproval()

  const handleSuperanonBan = async (e) => {
    e.preventDefault()

    const accessToken = await getAccessToken()

    setLoadingSuperanonBan(true)
    axios.post(`${HOST_URL}/api/cast/superanon-ban`, {
      hash: castHash,
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      },
    }).then((response) => {
      setDeletedCastMap(prev => ({ ...prev, [castHash]: true }))
      toast.success('Cast superanon banned')
      if (isMobile) {
        if (!!redirectToHash) {
          setHash(redirectToHash)
        } else {
          setHash('')
        }
      } else {
        if (!!redirectToHash) {
          setHash(redirectToHash)
        } else {
          setHash("")
        }
      }
      setOpenSuperanonBanDialog(false)
    }).catch((error) => {
      if (error.response.data.error === "NO_SIGNER_APPROVED") {
        setOpenSignerApproval(true)
      } else {
        toast.error('Error banning user from superanon')
      }
    }).finally(() => {
      setLoadingSuperanonBan(false)
    })
  }

  if (isMobile) {
    return (
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Ban user from superanon</DrawerTitle>
          <DrawerDescription>
            They will receive a warning and a notification first.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button
            variant="destructive"
            disabled={loadingSuperanonBan}
            className="w-full"
            onClick={(e) => { handleSuperanonBan(e) }}
          >
            {loadingSuperanonBan ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete and ban'
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full" disabled={loadingSuperanonBan}>Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    )
  }

  return (
    <DialogContent className="w-4/5 sm:w-full max-w-sm rounded-md">
      <DialogHeader>
        <DialogTitle>Ban user from superanon</DialogTitle>
        <DialogDescription>
          They will receive a warning and a notification first.
        </DialogDescription>
        <DialogClose />
      </DialogHeader>
      <div className="w-full flex flex-row justify-center items-center sm:justify-center sm:items-center">
        <Button
          variant="destructive"
          disabled={loadingSuperanonBan}
          className="w-32"
          onClick={(e) => { handleSuperanonBan(e) }}
        >
          {loadingSuperanonBan ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            'Delete and ban'
          )}
        </Button>
      </div>
    </DialogContent>
  )
}
