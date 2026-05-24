import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';
import { HOST_URL } from '@/utils/hostURL';
import { ArrowTopRightOnSquareIcon, LinkIcon } from '@heroicons/react/24/outline';
import { usePrivy } from '@privy-io/react-auth';
import axios from 'axios';
import { ZapIcon } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useOpenSignerApproval } from '@/providers/OpenSignerApprovalProvider'
import { Card } from '../ui/card';
import { AspectRatio } from '../ui/aspect-ratio';
import { Skeleton } from '../ui/skeleton';
import { LazyLoadImage } from 'react-lazy-load-image-component';

type FcFrameButton = {
  index: number,
  title: string,
  action_type: 'post' | 'link' | 'mint' | 'post_redirect' | 'tx'
  target?: string,
}

interface FarcasterFrameProps {
  castHash: string,
  version: string,
  image: string,
  image_aspect_ratio: "1:1" | "1.91:1",
  frame_url: string,
  buttons: FcFrameButton[],
  post_url: string,
  input: {
    text?: string,
  },
}

interface FarcasterFrameButtonProps {
  index: number,
  title: string,
  action_type: 'post' | 'link' | 'mint' | 'post_redirect' | 'tx'
  buttonCount: number,
  target?: string,
  handleFrameClick: (
    e: React.MouseEvent<HTMLButtonElement>,
    index: number,
    title: string,
    action_type: 'post' | 'link' | 'mint' | 'post_redirect' | 'tx',
    target?: string
  ) => void,
}

const FarcasterFrameButton: React.FC<FarcasterFrameButtonProps> = (props) => {


  const { index, title, action_type, buttonCount, handleFrameClick, target } = props

  return (
    <button
      onClick={(e) => handleFrameClick(
        e,
        index,
        title,
        action_type,
        target
      )}
      className={`flex flex-row items-center justify-center gap-x-1 text-sm w-full py-2 truncate text-gray-800 dark:text-gray-100 duration-100 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg bg-white dark:bg-slate-800 ${buttonCount === 1 && 'col-span-2'} ${(buttonCount === 3 && index === 3) && 'col-span-2'} disabled:opacity-50 disabled:cursor-not-allowed`}
      disabled={action_type === 'mint' || action_type === 'tx'}
    >
      {title}
      {(action_type === 'post_redirect' || action_type === 'link') && <ArrowTopRightOnSquareIcon className='w-4 h-4' />}
      {(action_type === 'mint' || action_type === 'tx') && <ZapIcon className='w-4 h-4' />}
    </button>
  )
}

const FarcasterFrame: React.FC<FarcasterFrameProps> = (props) => {

  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken } = usePrivy()
  const { setOpenSignerApproval } = useOpenSignerApproval()

  const { castHash, frame_url } = props

  const [imageURL, setImageURL] = useState(props.image)
  const [imageAspectRatio, setImageAspectRatio] = useState(props.image_aspect_ratio)
  const [buttons, setButtons] = useState(props.buttons)
  const [postURL, setPostURL] = useState(props.post_url)
  const [inputText, setInputText] = useState(props.input.text)
  const [userTextInput, setUserTextInput] = useState('')
  const [loadingNewFrame, setLoadingNewFrame] = useState(false)
  const [frameState, setFrameState] = useState('')

  const [imageError, setImageError] = useState(false);

  const handleImageError = () => setImageError(true);

  const handleFrameClick = async (e: React.MouseEvent<HTMLButtonElement>, index: number, title: string, action_type: 'post' | 'link' | 'mint' | 'post_redirect' | 'tx', target?: string) => {

    e.stopPropagation()
    e.preventDefault()

    if (action_type === 'link') {
      window.open(target, '_blank')
      return
    }

    const frameData = {
      hash: castHash,
      actionText: title,
      actionIndex: index,
      action_type: action_type,
      frameURL: frame_url,
      postURL: target ? target : postURL,
      userTextInput: userTextInput,
      state: frameState
    }

    setLoadingNewFrame(true)

    const accessToken = await getAccessToken()

    axios.post(`${HOST_URL}/api/frames`, frameData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    })
      .then((res) => {

        if (res.data.newFrame.image === imageURL) {
          toast.message('Nothing changed')
        }

        if (action_type === 'post_redirect') {
          window.open(res.data.newFrame, '_blank')
          return
        }

        setImageURL(res.data.newFrame.image)
        setImageAspectRatio(res.data.newFrame.image_aspect_ratio)
        setPostURL(res.data.newFrame.post_url)
        setInputText(res.data.newFrame.input.text)

        if (res.data.newFrame.state) {
          setFrameState(res.data.newFrame.state.serialized)
        }

        const newButtons = []

        res.data.newFrame.buttons.forEach((button: { index: number, title: string, action_type: 'post' | 'link' | 'mint' | 'post_redirect' | 'tx', target?: string }) => {
          newButtons.push({
            index: button.index,
            title: button.title,
            action_type: button.action_type,
            target: button.target
          })
        })
        setButtons(newButtons)
      })
      .catch((err) => {
        if (err.response.data.error === "NO_SIGNER_APPROVED") {
          setOpenSignerApproval(true)
        } else {
          console.error(err)
          toast.error('Frame produced an error')
        }
      })
      .finally(() => {
        setLoadingNewFrame(false)
      })
  }

  const getDomainFromUrl = (url) => {
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/\?]+)/i);
    return match && match[1] ? match[1] : null;
  };

  return (
    <Card className='w-full overflow-hidden bg-slate-200 dark:bg-slate-700 pb-2 flex flex-col gap-y-2'>
      <AspectRatio ratio={imageAspectRatio === '1:1' ? 1 : 1.91}>
        {!imageError && (
          <LazyLoadImage
            className={`w-full h-full object-cover ${loadingNewFrame ? 'animate-pulse' : ''}`}
            src={imageURL}
            placeholder={<Skeleton className='w-full h-full' />}
            onError={handleImageError}
            wrapperClassName="h-full w-full"
            threshold={2500}
          />
        )}
        {imageError && (
          <div className="h-full w-full flex items-center justify-center bg-gray-200">
            <p className="text-gray-500">Failed to load frame</p>
          </div>
        )}
      </AspectRatio>
      {!!inputText &&
        <div className='px-2'>
          <input
            type='text'
            value={userTextInput}
            onChange={(e) => setUserTextInput(e.target.value)}
            className='w-full rounded-lg text-sm mb-1 py-2 px-4 truncate dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-slate-700 border dark:border-gray-700 focus:outline-none focus:ring-0'
            placeholder={inputText}
            onClick={(e) => { e.stopPropagation(); e.preventDefault() }}
          />
        </div>
      }
      {buttons.length > 0 &&
        <div className='grid grid-cols-2 w-full px-2 gap-2 rounded-md'>
          {buttons.map((button) => (
            <FarcasterFrameButton
              key={button.index}
              index={button.index}
              title={button.title}
              action_type={button.action_type}
              handleFrameClick={handleFrameClick}
              buttonCount={buttons.length}
              target={button.target}
            />
          ))}
        </div>
      }
      <div className='w-full flex flex-row justify-end px-2'>
        <Link href={frame_url} target='_blank' className='text-xs text-gray-500 hover:underline'>
          {/* display only domain name */}
          {getDomainFromUrl(frame_url)}
        </Link>
      </div>
    </Card>
  );
};

export default FarcasterFrame;
