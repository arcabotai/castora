import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { LinkIcon } from '@heroicons/react/24/outline';
import { truncateLongWord } from '@/utils/textUtils';

const YTPattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const WebsitePreview = ({ embed, isColumn }) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const handleImageLoad = () => setImageLoaded(true);
  const handleImageError = () => setImageError(true);

  const { url, metadata } = embed;
  const { html } = metadata;

  const youtubeMatch = url.match(YTPattern);
  const youtubeVideoID = youtubeMatch ? youtubeMatch[1] : null;

  if (youtubeVideoID) {
    return (
      <Card className="w-full">
        <Link href={url} target="_blank">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeVideoID}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className='rounded-md w-full h-48 sm:h-64'
            onClick={(e) => e.stopPropagation()}
          >
          </iframe>
        </Link>
      </Card>
    );
  }

  if (!html) return null;

  const imageUrl = html.ogImage && html.ogImage[0] ? html.ogImage[0].url : null;
  const title = html.ogTitle || 'No title';
  const description = html.ogDescription || 'No description available';

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <Link href={url} target="_blank">
        <div className='flex flex-row h-16 w-full'>
          <div className="relative w-24 shrink-0">
            {imageUrl && !imageError ? (
              <>
                {!imageLoaded && (
                  <Skeleton className="" />
                )}
                <LazyLoadImage
                  src={imageUrl}
                  afterLoad={handleImageLoad}
                  onError={handleImageError}
                  className="object-cover w-24 h-16 rounded-l-lg"
                  threshold={2500}
                />
              </>
            ) : (
              <div className="flex items-center justify-center w-24 h-16 bg-gray-200">
                <LinkIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
          <CardContent className="px-2 py-1 truncate">
            <h3 className="text-md font-semibold mb-1 truncate">{truncateLongWord(title, 24)}</h3>
            <p className="text-xs text-gray-400 truncate">{truncateLongWord(url, 24)}</p>
          </CardContent>
        </div>
      </Link>
    </Card>
  );
};

const CastEmbedWebsites = ({ websites, isColumn }) => {
  return (
    <div className="flex flex-col gap-y-2">
      {websites.map((embed, index) => (
        <WebsitePreview key={embed.url + index} embed={embed} isColumn={isColumn} />
      ))}
    </div>
  );
};

export default CastEmbedWebsites;
