import { useState } from "react";
import { EllipsisHorizontalIcon, FlagIcon, TrashIcon, BoltIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { isMobile } from 'react-device-detect';

import { Dialog, DialogContent } from "../ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose, DrawerFooter } from "../ui/drawer";
import { DeleteCastDialogContent } from "./DeleteCastDialogContent";
import { Button } from "../ui/button";
import { BoostRequestDialogContent } from "./BoostRequestDialogContent";
import { MoxieStatsContent } from "./MoxieStatsContent";
import MoxieLogo from "../assets/MoxieLogo";
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider";
import { SUPERANON_ADMIN_FIDS } from "@/utils/anon/admin";
import { SuperanonBanDialogContent } from "./SuperanonBanDialogContent";
import { HammerIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSuperLogin } from "@/hooks/useSuperLogin";

interface CastOptionsProps {
  authorFid: number
  userFid: number
  castHash: string
  redirectToHash: string
  className?: string
  iconClassName?: string
  backgroundClassName?: string
}

export default function CastOptions({
  authorFid,
  userFid,
  castHash,
  redirectToHash,
  className = '',
  iconClassName = '',
  backgroundClassName = ''
}: CastOptionsProps) {
  const [openOptions, setOpenOptions] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'delete' | 'boost' | 'moxie' | 'superanonBan'>('main');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openBoostDialog, setOpenBoostDialog] = useState(false);
  const [openMoxieStats, setOpenMoxieStats] = useState(false);
  const [openSuperanonBanDialog, setOpenSuperanonBanDialog] = useState(false);
  const { supercastUserState, isAuthenticated, isGuest } = useSupercastUserState()

  const router = useRouter()
  const { login } = useSuperLogin()

  const isSuperanonAdmin = SUPERANON_ADMIN_FIDS.includes(supercastUserState.userFid)

  const handleSuperanonBan = (e) => {
    e.preventDefault();
    if (isMobile) {
      setCurrentView('superanonBan');
    } else {
      setOpenSuperanonBanDialog(true);
      setOpenOptions(false);
    }
  }

  const handleOpenWarpcast = (e) => {
    e.preventDefault();
    window.open(`https://warpcast.com/~/conversations/${castHash}`, '_blank');
    setOpenOptions(false);
  }

  const handleBoost = (e) => {
    if (!isAuthenticated()) {
      login()
      return
    } else if (isGuest()) {
      router.push('/onboarding')
      return
    }

    e.preventDefault();
    if (isMobile) {
      setCurrentView('boost');
    } else {
      setOpenBoostDialog(true);
      setOpenOptions(false);
    }
  }

  const handleDelete = (e) => {
    e.preventDefault();
    if (isMobile) {
      setCurrentView('delete');
    } else {
      setOpenDeleteDialog(true);
      setOpenOptions(false);
    }
  }

  const handleMoxieStats = (e) => {
    e.preventDefault();
    if (isMobile) {
      setCurrentView('moxie');
    } else {
      setOpenMoxieStats(true);
      setOpenOptions(false);
    }
  }

  const OptionButton = ({ onClick, icon, children, className = '' }) => (
    <Button
      onClick={onClick}
      variant="ghost"
      className={`w-full justify-start gap-x-2 ${className}`}
    >
      {icon}
      {children}
    </Button>
  );

  const optionsContent = (
    <>
      <OptionButton onClick={handleOpenWarpcast} icon={<img src="/warpcast.svg" className="w-4 h-4" />}>
        Open in Warpcast
      </OptionButton>
      <OptionButton
        onClick={handleMoxieStats}
        icon={<MoxieLogo width={4} height={4} />}
      >
        Check Moxie stats
      </OptionButton>
      <OptionButton onClick={handleBoost} icon={<BoltIcon className="w-4 h-4" />}>
        Boost cast
      </OptionButton>
      {authorFid === userFid && (
        <OptionButton
          onClick={handleDelete}
          icon={<TrashIcon className="w-4 h-4" />}
          className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
        >
          Delete
        </OptionButton>
      )}
      {(authorFid === Number(process.env.NEXT_PUBLIC_SUPERANON_FID) && isSuperanonAdmin) && (
        <OptionButton onClick={handleSuperanonBan} icon={<BoltIcon className="w-4 h-4" />}>
          Delete and ban
        </OptionButton>
      )}
    </>
  );

  const renderMobileContent = () => {
    switch (currentView) {
      case 'delete':
        return (
          <DeleteCastDialogContent
            castHash={castHash}
            redirectToHash={redirectToHash}
            setOpenDeleteDialog={() => setOpenOptions(false)}
          />
        );
      case 'boost':
        return (
          <BoostRequestDialogContent
            castHash={castHash}
            isOpen={openOptions}
            setOpen={() => setOpenOptions(false)}
          />
        );
      case 'moxie':
        return (
          <MoxieStatsContent
            castHash={castHash}
            setOpen={() => setOpenOptions(false)}
          />
        );
      case 'superanonBan':
        return (
          <SuperanonBanDialogContent
            castHash={castHash}
            redirectToHash={redirectToHash}
            setOpenSuperanonBanDialog={() => setOpenOptions(false)}
          />
        );
      default:
        return (
          <>
            <div className="p-4 space-y-2">
              {optionsContent}
            </div>
            <DrawerFooter>
              <DrawerClose>
                <Button variant='secondary' className='w-full'>Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </>
        );
    }
  };

  return (
    <>
      {isMobile ? (
        <Drawer open={openOptions} onOpenChange={(open) => {
          setOpenOptions(open);
          if (!open) setCurrentView('main');
        }}>
          <DrawerTrigger asChild>
            <button className={className}>
              <div className={backgroundClassName}></div>
              <EllipsisHorizontalIcon className={`${iconClassName} border rounded-full border-gray-400 group-active:border-red-600 sm:group-hover:border-red-600`} />
            </button>
          </DrawerTrigger>
          <DrawerContent>
            {renderMobileContent()}
          </DrawerContent>
        </Drawer>
      ) : (
        <>
          <DropdownMenu onOpenChange={setOpenOptions} open={openOptions}>
            <DropdownMenuTrigger asChild>
              <button className={className}>
                <div className={`${backgroundClassName}`}></div>
                <EllipsisHorizontalIcon className={`${iconClassName} border rounded-full border-gray-400 group-active:border-red-600 sm:group-hover:border-red-600`} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="bottom"
              align="end"
              className="w-52 py-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700"
            >
              <DropdownMenuItem className="px-2 py-1 text-sm">
                <button onClick={handleOpenWarpcast} className="flex items-center w-full text-left">
                  <img src="/warpcast.svg" className="w-4 h-4 mr-2" />
                  Open in Warpcast
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem className="px-2 py-1 text-sm">
                <button onClick={handleMoxieStats} className="flex items-center gap-x-2 w-full text-left">
                  <MoxieLogo width={4} height={4} />
                  Check Moxie stats
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem className="px-2 py-1 text-sm">
                <button onClick={handleBoost} className="flex items-center w-full text-left">
                  <BoltIcon className="w-4 h-4 mr-2" />
                  Boost cast
                </button>
              </DropdownMenuItem>
              {authorFid === userFid && (
                <DropdownMenuItem className="px-2 py-1 text-sm">
                  <button onClick={handleDelete} className="flex items-center w-full text-left text-red-500 hover:text-red-600">
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </DropdownMenuItem>
              )}
              {(authorFid === Number(process.env.NEXT_PUBLIC_SUPERANON_FID) && isSuperanonAdmin) && (
                <DropdownMenuItem className="px-2 py-1 text-sm">
                  <button onClick={handleSuperanonBan} className="flex items-center w-full text-left">
                    <HammerIcon className="w-4 h-4 mr-2" />
                    Delete and ban
                  </button>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
            <DeleteCastDialogContent
              castHash={castHash}
              redirectToHash={redirectToHash}
              setOpenDeleteDialog={setOpenDeleteDialog}
            />
          </Dialog>
          <Dialog open={openMoxieStats} onOpenChange={setOpenMoxieStats}>
            <DialogContent>
              <MoxieStatsContent
                castHash={castHash}
                setOpen={setOpenMoxieStats}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={openBoostDialog} onOpenChange={setOpenBoostDialog}>
            <BoostRequestDialogContent
              castHash={castHash}
              isOpen={openBoostDialog}
              setOpen={setOpenBoostDialog}
            />
          </Dialog>
          <Dialog open={openSuperanonBanDialog} onOpenChange={setOpenSuperanonBanDialog}>
            <SuperanonBanDialogContent
              castHash={castHash}
              redirectToHash={redirectToHash}
              setOpenSuperanonBanDialog={setOpenSuperanonBanDialog}
            />
          </Dialog>
        </>
      )}
    </>
  );
}
