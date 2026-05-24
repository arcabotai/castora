import { HOST_URL } from '@/utils/hostURL';
import { truncateLongWord } from '@/utils/textUtils';
import { ExclamationCircleIcon, LinkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

import { useImageInFocus } from '@/providers/ImageInFocusProvider';

import { useState, useEffect } from 'react'
import FarcasterFrame from './FarcasterFrame';
import ReactPlayer from 'react-player';
import OtherURLPreview from './OtherURLPreview';
import { Skeleton } from '../ui/skeleton';
import Tweet from '../tweet/tweet';

interface URLPreviewCardProps {
  url: string,
  small: boolean,
  castHash: string,
  ignoreList?: string[],
}

type FcFrameButton = {
  index: number,
  title: string,
  action_type: 'post' | 'link' | 'mint' | 'post_redirect' | 'tx'
  target?: string,
}

export default function URLPreviewCard({ url, small, castHash, ignoreList }: URLPreviewCardProps) {

  const [image, setImage] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [linkURL, setLinkURL] = useState(url)
  const [source, setSource] = useState<'youtube' | 'twitter' | 'other' | 'image' | 'fcframe' | 'video'>()
  const [youtubeVideoID, setYoutubeVideoID] = useState('')
  const [tweetID, setTweetID] = useState('')

  const [fcFrameVersion, setFcFrameVersion] = useState('')
  const [fcFrameImage, setFcFrameImage] = useState('')
  const [fcFrameButtons, setFcFrameButtons] = useState<FcFrameButton[]>([])
  const [fcFramePostURL, setFcFramePostURL] = useState('')
  const [fcFrameInput, setFcFrameInput] = useState('')
  const [fcImageAspectRatio, setFcImageAspectRatio] = useState<"1:1" | "1.91:1">('1.91:1')

  const { setOpen: setOpenImageInFocus, setImage: setImageInFocus } = useImageInFocus()

  const handleOpenImage = (e, url) => {
    setImageInFocus(url)
    setOpenImageInFocus(true)
    e.stopPropagation()
    e.preventDefault()
  }

  useEffect(() => {
    if (!url) return;

    if (
      url.slice(-5).toLowerCase() === '.jpeg' ||
      url.slice(-4).toLowerCase() === '.jpg' ||
      url.slice(-4).toLowerCase() === '.png' ||
      url.slice(-4).toLowerCase() === '.gif' ||
      url.slice(-4).toLowerCase() === '.svg' ||
      url.slice(-5).toLowerCase() === '.webp' ||
      url.slice(-4).toLowerCase() === '.bmp' ||
      // if starts with https://imagedelivery.net/ then its a warpcast uploaded image
      url.startsWith('https://imagedelivery.net/')
    ) {
      setSource('image')
      return
    }

    if (
      url.slice(-4) === '.mp4' ||
      url.slice(-4) === '.mov' ||
      url.slice(-4) === '.avi' ||
      url.slice(-4) === '.mkv' ||
      url.slice(-5) === '.webm' ||
      url.slice(-5) === '.m3u8'
    ) {
      setSource('video')
      return
    }

    const YTPattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/

    const isYoutube = YTPattern.test(url)
    if (isYoutube) {
      const videoID = url.match(YTPattern)[1]
      setSource('youtube')
      setYoutubeVideoID(videoID)
      return
    }

    const TweetPattern = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?:\w+)\/status\/(\d+)/;

    const isTwitter = TweetPattern.test(url)
    if (isTwitter) {
      const tweetID = url.match(TweetPattern)[1]
      setSource('twitter')
      setTweetID(tweetID)
      return
    }

    axios.get(`${HOST_URL}/api/url-preview/other?query=${url}`)
      .then((res) => {
        setImage(res.data.tags["og:image"])
        setTitle(res.data.tags["og:title"])
        setDescription(res.data.tags["og:description"])

        if (!!res.data.tags["fc:frame"]) {
          // check if it's a farcaster frame
          setFcFrameVersion(res.data.tags["fc:frame"])
          setFcFrameImage(res.data.tags["fc:frame:image"])
          setFcFrameInput(res.data.tags["fc:frame:input:text"])
          const actionIndexes = [1, 2, 3, 4]
          actionIndexes.forEach((i) => {
            if (res.data.tags[`fc:frame:button:${i}`]) {
              setFcFrameButtons((prev) => [...prev, {
                index: i,
                title: res.data.tags[`fc:frame:button:${i}`],
                action_type: res.data.tags[`fc:frame:button:${i}:action`] ? res.data.tags[`fc:frame:button:${i}:action`] : 'post'
              }])
            }
          })
          setFcFramePostURL(res.data.tags["fc:frame:post_url"])
          setFcImageAspectRatio(res.data.tags["fc:frame:image_aspect_ratio"])
          setSource('fcframe')
        } else {
          setSource('other')
        }
      })
      .catch((err) => {
        console.log(err)
      })
  }, [url]);

  if (!!ignoreList && ignoreList.includes(url)) return null

  return (
    <div className='min-h-[100px]'>
      {source === 'image' &&
        // image
        <button key={url} onClick={(e) => handleOpenImage(e, url)}><img src={url} className='shadow-sm rounded-md max-h-[300px]' /></button>
      }
      {
        source === 'video' &&
        <div className='rounded-md overflow-hidden'>
          <ReactPlayer
            url={url}
            className='rounded-md'
            width='100%'
            height='300px'
            controls={true}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
          />
        </div>
      }
      {
        source === 'youtube' &&
        <iframe
          src={`https://www.youtube.com/embed/${youtubeVideoID}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className='rounded-md w-[280px] sm:w-[360px] h-[210px]'
          onClick={(e) => e.stopPropagation()}
        >
        </iframe>
      }
      {
        source === 'twitter' &&
        <Tweet
          id={tweetID}
        />
      }
      {
        source === 'fcframe' && <FarcasterFrame
          castHash={castHash}
          version={fcFrameVersion}
          image={fcFrameImage}
          buttons={fcFrameButtons}
          frame_url={url}
          post_url={fcFramePostURL}
          input={{
            text: fcFrameInput
          }}
          image_aspect_ratio={fcImageAspectRatio}
        />
      }
      {
        source === 'other' &&
        <OtherURLPreview
          image={image}
          title={title}
          description={description}
          small={small}
          url={linkURL}
        />
      }
    </div >
  );
}
