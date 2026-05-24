import type { MediaDetails } from 'react-tweet/api'
import { type EnrichedTweet, getMediaUrl, getMp4Video } from 'react-tweet'
import BlurImage from './blur-image'
import { useImageInFocus } from '@/providers/ImageInFocusProvider'

export const TweetMedia = ({
  tweet,
  media,
}: {
  tweet: EnrichedTweet
  media: MediaDetails
}) => {

  const { setOpen: setOpenImageInFocus, setImage: setImageInFocus } = useImageInFocus()

  const handleOpenImage = (e, url) => {
    setImageInFocus(url)
    setOpenImageInFocus(true)
    e.stopPropagation()
    e.preventDefault()
  }

  if (media.type == 'video') {
    return (
      <video
        className="rounded-lg drop-shadow-sm max-h-[300px]"
        loop
        width='100%'
        height='300px'
        autoPlay
        muted
        playsInline
      >
        <source src={getMp4Video(media).url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    )
  }

  return (
    <button key={getMediaUrl(media, 'small')} onClick={(e) => handleOpenImage(e, getMediaUrl(media, 'small'))}><img src={getMediaUrl(media, 'small')} className='shadow-sm rounded-md max-h-[300px]' /></button>
  )
}