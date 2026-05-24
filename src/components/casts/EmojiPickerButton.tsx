import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { FaceSmileIcon } from '@heroicons/react/24/outline';
import { DRAFT_SEND_STATUS, Draft } from '@prisma/client';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

export default function EmojiPickerButton({
  currentDraft,
  castText,
  setCastText,
  textareaElement,
  cursorPosition
}: {
  currentDraft?: Draft,
  castText: string,
  setCastText: React.Dispatch<React.SetStateAction<string>>,
  textareaElement: HTMLTextAreaElement,
  cursorPosition: number
}) {

  const { theme } = useTheme()

  // emoji-picker-react theme uses light / dark / auto
  // next-themes uses light / dark / system
  const emojiPickerTheme = ['light', 'dark'].includes(theme as string) ? theme : 'auto'

  const handleEmojiInsert = (emojiObject, event) => {
    const updatedText = castText.slice(0, cursorPosition) + emojiObject.emoji + castText.slice(cursorPosition)
    setCastText(updatedText)

    textareaElement.focus()
    // needs the timeout to work
    setTimeout(() => {
      textareaElement.setSelectionRange(cursorPosition + emojiObject.emoji.length, cursorPosition + emojiObject.emoji.length);
    }, 0);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="flex flex-row items-center justify-center"
          variant='outline'
          size='sm'
          disabled={!!currentDraft && (currentDraft.sendStatus === DRAFT_SEND_STATUS.SENT || currentDraft.sendStatus === DRAFT_SEND_STATUS.SCHEDULED)}
        >
          <FaceSmileIcon className='w-5 h-5 text-gray-500' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 border-none rounded-lg w-[300px]" sideOffset={5}>
        <EmojiPicker
          onEmojiClick={handleEmojiInsert}
          height={400}
          width={300}
          autoFocusSearch={true}
          theme={emojiPickerTheme as Theme}
          className='border-none'
        />
      </PopoverContent>
    </Popover>
  )
}
