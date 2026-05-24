import { useState } from "react"
import { isMobile } from "react-device-detect"
import { PetOption } from "@prisma/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Loader2 } from "lucide-react"
import { useIosPwa } from "@/providers/iOSPwaProvider"
import axios from "axios"
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider"
import { usePrivy } from "@privy-io/react-auth"
import { HOST_URL } from "@/utils/hostURL"
import { toast } from "sonner"
import { useQueryClient } from "react-query"

interface PetSelectionConfirmationProps {
  isOpen: boolean
  onClose: () => void
  petOption: PetOption
}

export function PetSelectionConfirmation({ isOpen, onClose, petOption }: PetSelectionConfirmationProps) {

  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken } = usePrivy()
  const queryClient = useQueryClient()

  const [isLoading, setIsLoading] = useState(false)
  const { isIosPwa } = useIosPwa();

  const handleConfirm = async () => {
    setIsLoading(true)

    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/pets`, {
      selectedPetOptionId: petOption.id,
    }, {
      headers: {
        'asFid': supercastUserState.currentFid,
        Authorization: `Bearer ${accessToken}`,
      },
    }).then((res) => {
      queryClient.invalidateQueries({ queryKey: ['myPet'] })
    }).catch((err) => {
      console.error(err)
      toast.error('Failed to select pet')
    }).finally(() => {
      setIsLoading(false)
    })
  }



  const content = (
    <>
      <div className="text-sm">
        <p className="">Are you sure you want to select {petOption.name} as your pet?</p>
        <p className="">This action cannot be undone.</p>
      </div>
      <div className={`flex flex-col gap-2 mt-4 ${isIosPwa ? 'pb-6' : 'pb-0'}`}>
        <Button onClick={handleConfirm} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Selecting...
            </>
          ) : (
            'Select'
          )}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onClose={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Select {petOption.name}</DrawerTitle>
            <DrawerDescription>
              Confirm your pet selection
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select {petOption.name}</DialogTitle>
          <DialogDescription>
            Confirm your pet selection
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
