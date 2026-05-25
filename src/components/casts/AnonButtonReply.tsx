import React, { useState } from 'react';
import { GifIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { Grid } from '@giphy/react-components'
import { GiphyFetch } from '@giphy/js-fetch-api'
import { DebounceInput } from 'react-debounce-input';
import { isMobile } from 'react-device-detect';
import { DRAFT_SEND_STATUS, Draft, PRODUCT_TYPE } from '@prisma/client';
import { Button } from '../ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTrigger } from '../ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Loader2 } from 'lucide-react';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';
import { useCheckoutDialog } from '@/hooks/useCheckoutDialog';
import Image from 'next/image';

interface Props {
  isAnon: boolean;
  setIsAnon: (isAnon: boolean) => void;
}

export default function AnonButtonReply({ isAnon, setIsAnon }: Props) {

  const { isRegularUser, isSuperMember } = useSupercastUserState()
  const { openCheckout } = useCheckoutDialog()

  const [openConfirmation, setOpenConfirmation] = useState(false);

  const handleConfirm = () => {
    setIsAnon(true)
    setOpenConfirmation(false);
  }

  const ConfirmationDialog = () => (
    <div className={`px-4 ${isMobile ? '-my-2' : 'my-2'}`}>
      <p className='text-sm text-gray-500'>Legacy anonymous posting is disabled during Castora beta.</p>
      <p className='text-sm text-gray-500 mt-2'>Rules:</p>
      <ul className='list-disc list-inside text-sm text-gray-500 mt-0 flex flex-col gap-y-1'>
        <li>No token or self promotion</li>
        <li>No personal attacks</li>
        <li>No nsfw, spam, or other inappropriate content</li>
        <li>English only</li>
        <li>If you break these rules, your account will be banned</li>
      </ul>
      {isRegularUser() && !isSuperMember() &&
        <Button
          className='w-full mt-4'
          onClick={() => {
            openCheckout(PRODUCT_TYPE.MEMBERSHIP)
          }}
        >
          Become a member
        </Button>
      }
      {isSuperMember() &&
        <Button
          className='w-full mt-4'
          onClick={handleConfirm}
        >
          Yes, I understand
        </Button>
      }
    </div>
  )

  return (
    <div className="flex items-center gap-x-2 relative">
      {isMobile ? (
        <Drawer open={openConfirmation} onOpenChange={setOpenConfirmation}>
          <DrawerTrigger asChild>
            <Button
              className="flex flex-row items-center justify-center"
              variant={isAnon ? 'default' : 'outline'}
              size='sm'
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isAnon) {
                  setIsAnon(false);
                } else {
                  setOpenConfirmation(true);
                }
              }}
            >
              <Image src="/superanon.png" alt="Anonymous account icon" width={20} height={20} className={`w-5 h-5 rounded-full object-cover ${isAnon ? 'border-black dark:border-white' : 'border-gray-500'}`} />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="p-0">
            <DrawerHeader>
              <h2 className='text-lg font-semibold'>Post anonymously</h2>
            </DrawerHeader>
            <ConfirmationDialog />
            <DrawerFooter>
              <DrawerClose>
                <Button variant='secondary' className='w-full'>Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={openConfirmation} onOpenChange={setOpenConfirmation}>
          <PopoverTrigger asChild>
            <Button
              className="flex flex-row items-center justify-center"
              variant={isAnon ? 'default' : 'outline'}
              size='sm'
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isAnon) {
                  setIsAnon(false);
                } else {
                  setOpenConfirmation(true);
                }
              }}
            >
              <Image src="/superanon.png" alt="Anonymous account icon" width={20} height={20} className={`w-5 h-5 rounded-full object-cover ${isAnon ? 'border-black dark:border-white' : 'border-gray-500'}`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="py-2 px-0" align="center">
            <h2 className='text-lg font-semibold text-center'>Post anonymously</h2>
            <ConfirmationDialog />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
