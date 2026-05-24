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
import { useDeletedCast } from "@/providers/DeletedCastsProvider";
import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useOpenSignerApproval } from '@/providers/OpenSignerApprovalProvider'
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider";
import { Loader2 } from "lucide-react";

interface DeleteCastDialogContentProps {
  castHash: string
  redirectToHash: string
  setOpenDeleteDialog: (value: boolean) => void
}

export function DeleteCastDialogContent(props: DeleteCastDialogContentProps) {

  const { castHash, redirectToHash, setOpenDeleteDialog } = props

  const { deletedCastMap, setDeletedCastMap } = useDeletedCast()
  const { setHash } = useSelectedCast()
  const [loadingDelete, setLoadingDelete] = useState(false)

  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken } = usePrivy()
  const { setOpenSignerApproval } = useOpenSignerApproval()

  const handleDelete = async (e) => {
    e.preventDefault()

    const accessToken = await getAccessToken()

    setLoadingDelete(true)
    axios.delete(`${HOST_URL}/api/cast/delete`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      },
      data: {
        'hash': `${castHash}`
      }
    }).then((response) => {
      setDeletedCastMap(prev => ({ ...prev, [castHash]: true }))
      toast.success('Cast deleted')
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
      setOpenDeleteDialog(false)
    }).catch((error) => {
      if (error.response.data.error === "NO_SIGNER_APPROVED") {
        setOpenSignerApproval(true)
      } else {
        toast.error('Error deleting cast')
      }
    }).finally(() => {
      setLoadingDelete(false)
    })
  }

  if (isMobile) {
    return (
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Delete this cast</DrawerTitle>
          <DrawerDescription>
            This action can't be undone.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button
            variant="destructive"
            disabled={loadingDelete}
            className="w-full"
            onClick={(e) => { handleDelete(e) }}
          >
            {loadingDelete ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full" disabled={loadingDelete}>Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    )
  }

  return (
    <DialogContent className="w-4/5 sm:w-full max-w-sm rounded-md">
      <DialogHeader>
        <DialogTitle>Delete this cast</DialogTitle>
        <DialogDescription>
          This action can't be undone.
        </DialogDescription>
        <DialogClose />
      </DialogHeader>
      <div className="w-full flex flex-row justify-center items-center sm:justify-center sm:items-center">
        <Button
          variant="destructive"
          disabled={loadingDelete}
          className="w-32"
          onClick={(e) => { handleDelete(e) }}
        >
          {loadingDelete ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            'Delete'
          )}
        </Button>
      </div>
    </DialogContent>
  )
}
