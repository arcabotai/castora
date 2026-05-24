import { HOST_URL } from '@/utils/hostURL';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import { useQuery } from 'react-query'
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card"
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';
import { usePrivy } from '@privy-io/react-auth';
import { isMobile } from 'react-device-detect';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { DropdownMenuContent } from '@radix-ui/react-dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import posthog from 'posthog-js';

interface TriggerButtonProps {
  openDegenTipMenu: boolean;
  setOpenDegenTipMenu: React.Dispatch<React.SetStateAction<boolean>>;
}

function TriggerButton(props: TriggerButtonProps) {

  const { openDegenTipMenu, setOpenDegenTipMenu } = props

  return <Button
    onClick={() => setOpenDegenTipMenu(!openDegenTipMenu)}
    className="flex flex-row items-center justify-center"
    variant='outline'
    size='sm'
  >
    <img src="/hat.svg" className='w-5 h-5' />
  </Button>
}

interface TippingMenuProps {
  handleTipInsert: (value: number) => void;
}

function TippingMenu(props: TippingMenuProps) {

  const { handleTipInsert } = props

  return (
    <div className='flex flex-row gap-x-2 px-4 sm:px-0'>
      <Button
        className="w-full"
        variant='outline'
        onClick={() => handleTipInsert(0.05)}
      >
        5%
      </Button>
      <Button
        className="w-full"
        variant='outline'
        onClick={() => handleTipInsert(0.25)}
      >
        25%
      </Button>
      <Button
        className="w-full"
        variant='outline'
        onClick={() => handleTipInsert(1)}
      >
        100%
      </Button>
    </div>
  )
}

export default function DegenButton({
  castText,
  setCastText,
  textareaElement,
  cursorPosition
}: {
  castText: string,
  setCastText: React.Dispatch<React.SetStateAction<string>>,
  textareaElement: HTMLTextAreaElement,
  cursorPosition: number
}) {

  const [openDegenTipMenu, setOpenDegenTipMenu] = useState(false);

  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken } = usePrivy()

  const fetchDegenAllowance = async () => {
    const accessToken = await getAccessToken()

    const response = await axios.get(`${HOST_URL}/api/degen/allowance`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    });
    return response.data;
  }

  const degenAllowanceQuery = useQuery(
    ['degenAllowance', supercastUserState],
    fetchDegenAllowance,
    { enabled: !!supercastUserState }
  );

  const handleTipInsert = (value: number) => {

    const tipValue = Math.floor(Number(degenAllowanceQuery.data.allowance) * value)

    const updatedText = castText.length > 0 ? `${castText}\n\n${tipValue} $DEGEN` : `${tipValue} $DEGEN`
    setCastText(updatedText)

    posthog.capture('degen_tipped', {
      asFid: supercastUserState.currentFid,
      tipValue: tipValue
    })

    textareaElement.focus()

    setOpenDegenTipMenu(false)
  }

  if (isMobile) {
    return (
      <Drawer open={openDegenTipMenu} onClose={() => setOpenDegenTipMenu(false)}>
        <DrawerTrigger>
          <TriggerButton openDegenTipMenu={openDegenTipMenu} setOpenDegenTipMenu={setOpenDegenTipMenu} />
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Tip $DEGEN</DrawerTitle>
          </DrawerHeader>
          <TippingMenu handleTipInsert={handleTipInsert} />
          <DrawerFooter>
            <div className='flex flex-row justify-center'>
              <p className='text-sm'>{`Your tip allowance is ${degenAllowanceQuery.isSuccess ? degenAllowanceQuery.data.allowance : 'loading...'} $DEGEN`}</p>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <div>
      <Popover>
        <PopoverTrigger>
          <TriggerButton openDegenTipMenu={openDegenTipMenu} setOpenDegenTipMenu={setOpenDegenTipMenu} />
        </PopoverTrigger>
        <PopoverContent className='p-2'>
          <TippingMenu handleTipInsert={handleTipInsert} />
          {(degenAllowanceQuery.isSuccess) &&
            <div className='flex flex-row justify-center mt-2'>
              <p className='text-sm'>{`Your tip allowance is ${degenAllowanceQuery.isSuccess ? degenAllowanceQuery.data.allowance : 'loading...'} $DEGEN`}</p>
            </div>
          }
        </PopoverContent>
      </Popover >
    </div>
  )
}
