import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerOverlay, DrawerTrigger } from '../ui/drawer'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  ArrowPathRoundedSquareIcon as ArrowPathRoundedSquareIconOutline, PencilIcon,
} from '@heroicons/react/24/outline'
import {
  ArrowPathRoundedSquareIcon as ArrowPathRoundedSquareIconSolid,
} from '@heroicons/react/24/solid'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { HOST_URL } from '@/utils/hostURL'
import { usePrivy } from '@privy-io/react-auth'
import { useOpenSignerApproval } from '@/providers/OpenSignerApprovalProvider'
import { toast } from 'sonner'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { formatNumber } from '@/utils/textUtils'
import { useDraftId } from '@/providers/DraftIdProvider'
import { useDraftComposeWindow } from '@/providers/DraftComposeWindowProvider'
import { Button } from '../ui/button'
import { useHotkeys } from 'react-hotkeys-hook'
import { useSelectedCast } from '@/providers/SelectedCastProvider'
import { useInteractions } from '@/providers/InteractionProvider'
import { useSuperLogin } from '@/hooks/useSuperLogin'
import { useRouter } from 'next/navigation'

interface RecastButtonProps {
  castHash: string,
  authorFid: number,
  recastCount: number,
  recastStatus: boolean,
  setRecastCount: React.Dispatch<React.SetStateAction<number>>,
  setRecastStatus: React.Dispatch<React.SetStateAction<boolean>>,
  iconClass: string,
  buttonClass: string,
  backgroundCircleClass: string,
  isSelected?: boolean,
  isCastDetail?: boolean,
}

export default function RecastButton({
  castHash,
  authorFid,
  recastCount: initialRecastCount,
  recastStatus: initialRecastStatus,
  setRecastCount,
  setRecastStatus: setLocalRecastStatus,
  iconClass,
  buttonClass,
  backgroundCircleClass,
  isSelected = false,
  isCastDetail = false,
}: RecastButtonProps) {

  const { setOpenDraftComposeWindow, setInitialRecastId, setInitialText, setInitialEmbeds } = useDraftComposeWindow();
  const { setDraftId } = useDraftId()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 1024px)')

  const { login } = useSuperLogin();
  const router = useRouter();

  const { supercastUserState, isAuthenticated, isGuest } = useSupercastUserState()
  const { getAccessToken } = usePrivy()

  const { setOpenSignerApproval } = useOpenSignerApproval()
  const { hash: selectedCastHash } = useSelectedCast()
  const { recastedCasts, addRecastedCast, removeRecastedCast, isRecasted, getRecastCount, isOverridden } = useInteractions();

  const overridden = isOverridden(castHash, 'recast')

  const recastCast = async () => {
    addRecastedCast(castHash, overridden ? getRecastCount(castHash) : initialRecastCount)

    const accessToken = await getAccessToken();

    axios.post(`${HOST_URL}/api/reactions/recast`, { "hash": castHash }, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "asFid": supercastUserState.currentFid,
      }
    }).catch((error) => {
      removeRecastedCast(castHash, overridden ? getRecastCount(castHash) : initialRecastCount)
      if (error.response.data.error === "NO_SIGNER_APPROVED") {
        setOpenSignerApproval(true);
      } else {
        toast.error('Error recasting cast');
      }
    });
  }

  const unrecastCast = async () => {
    removeRecastedCast(castHash, overridden ? getRecastCount(castHash) : initialRecastCount)

    const accessToken = await getAccessToken();

    axios.post(`${HOST_URL}/api/reactions/unrecast`, { "hash": castHash }, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "asFid": supercastUserState.currentFid,
      }
    }).catch((error) => {
      addRecastedCast(castHash, overridden ? getRecastCount(castHash) : initialRecastCount)
      if (error.response.data.error === "NO_SIGNER_APPROVED") {
        setOpenSignerApproval(true);
      } else {
        toast.error('Error unreacting to cast');
      }
    });
  }

  const checkAuthAndRedirect = () => {
    if (!isAuthenticated()) {
      login()
      return
    } else if (isGuest()) {
      router.push('/onboarding')
      return
    }
  }

  const handleRecastClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()

    checkAuthAndRedirect()

    if (overridden ? isRecasted(castHash) : initialRecastStatus) {
      unrecastCast()
    } else {
      recastCast()
    }
  }

  const handleQuoteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()

    checkAuthAndRedirect()

    setOpenDraftComposeWindow(true)
    setDraftId(null)
    setInitialText('')
    setInitialEmbeds([])
    setInitialRecastId({ hash: castHash, fid: authorFid })
  }

  const handleOptionClick = (action: 'recast' | 'quote') => (e: React.MouseEvent<HTMLButtonElement>) => {
    if (action === 'recast') {
      handleRecastClick(e)
    } else {
      handleQuoteClick(e)
    }
    setDropdownOpen(false)
    setIsDrawerOpen(false)
  }

  const handleRecastHotkey = async (e: KeyboardEvent) => {
    checkAuthAndRedirect()

    if ((selectedCastHash === castHash && isCastDetail) || (isSelected && !selectedCastHash)) {
      if (overridden ? isRecasted(castHash) : initialRecastStatus) {
        unrecastCast()
      } else {
        recastCast()
      }
    }
  }

  const handleQuoteHotkey = async (e: KeyboardEvent) => {
    checkAuthAndRedirect()

    if ((selectedCastHash === castHash && isCastDetail) || (isSelected && !selectedCastHash)) {
      setOpenDraftComposeWindow(true)
      setDraftId(null)
      setInitialText('')
      setInitialEmbeds([])
      setInitialRecastId({ hash: castHash, fid: authorFid })
    }
  }

  useHotkeys(
    'c',
    handleRecastHotkey,
    { preventDefault: true },
    [
      selectedCastHash,
      overridden,
      isRecasted(castHash),
      isCastDetail,
      initialRecastStatus,
      initialRecastCount,
      getRecastCount(castHash),
      castHash,
      isSelected
    ]
  )
  useHotkeys('q', handleQuoteHotkey, { preventDefault: true }, [selectedCastHash, isCastDetail, isSelected])

  const RecastOption = ({ recastStatus, handleOptionClick }) => (
    <button
      onClick={handleOptionClick('recast')}
      className='w-full flex flex-row items-center gap-x-2 text-left px-2 py-1.5'
    >
      <ArrowPathRoundedSquareIconOutline className={`${iconClass} text-gray-400`} />
      {recastStatus ? "Unrecast" : "Recast"}
    </button>
  )

  const QuoteOption = ({ handleOptionClick }) => (
    <button
      onClick={handleOptionClick('quote')}
      className='w-full flex flex-row items-center gap-x-2 text-left px-2 py-1.5'
    >
      <PencilIcon className={`${iconClass} text-gray-400`} />
      Quote
    </button>
  )

  const TriggerButton = () => (
    <button
      className={`${buttonClass} w-14 h-9 py-2 pl-3 focus:outline-none`}
      onClick={(e) => {
        setIsDrawerOpen(true)
        e.stopPropagation()
        e.preventDefault()
      }}
    >
      <div className={`${backgroundCircleClass} bg-green-300`}></div>
      {(overridden ? isRecasted(castHash) : initialRecastStatus)
        ? <ArrowPathRoundedSquareIconSolid className={`${iconClass} text-green-500 -mt-[1px]`} />
        : <ArrowPathRoundedSquareIconOutline className={`${iconClass} -mt-[1px] text-gray-400 group-active:text-green-500 sm:group-hover:text-green-500`} />
      }
      <span className={`text-sm text-gray-400 group-active:text-green-500 sm:group-hover:text-green-500 ${(overridden ? isRecasted(castHash) : initialRecastStatus) && "text-green-500"}`}>{formatNumber(overridden ? getRecastCount(castHash) : initialRecastCount)}</span>
    </button>
  )

  if (isMobile) {
    return (
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <TriggerButton />
        </DrawerTrigger>
        <DrawerContent onClick={(e) => e.stopPropagation()}>
          <div className="p-4">
            <div className="space-y-2">
              <RecastOption recastStatus={(overridden ? isRecasted(castHash) : initialRecastStatus)} handleOptionClick={handleOptionClick} />
              <QuoteOption handleOptionClick={handleOptionClick} />
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose>
              <Button variant='secondary' className='w-full'>Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <DropdownMenu
      open={dropdownOpen}
      onOpenChange={(isOpen) => setDropdownOpen(isOpen)}
    >
      <DropdownMenuTrigger>
        <TriggerButton />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <RecastOption recastStatus={(overridden ? isRecasted(castHash) : initialRecastStatus)} handleOptionClick={handleOptionClick} />
        </DropdownMenuItem>
        <DropdownMenuItem>
          <QuoteOption handleOptionClick={handleOptionClick} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
