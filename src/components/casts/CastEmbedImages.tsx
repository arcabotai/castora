import React, { useState } from 'react';
import { useImageInFocus } from "@/providers/ImageInFocusProvider";
import URLPreviewCard from "./URLPreview";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyLoadImage } from 'react-lazy-load-image-component';

const ImageWithLazyLoad = ({ image, aspectRatio }) => {
  const [imageError, setImageError] = useState(false);
  const { setOpen: setOpenImageInFocus, setImage: setImageInFocus } = useImageInFocus();

  const handleImageError = () => setImageError(true);

  const handleOpenImage = (e) => {
    setImageInFocus(image.url);
    setOpenImageInFocus(true);
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <AspectRatio ratio={aspectRatio}>
      {!imageError && (
        <LazyLoadImage
          onClick={handleOpenImage}
          src={image.url}
          onError={handleImageError}
          placeholder={<Skeleton className='w-full h-full' />}
          className={`h-full w-full shadow-sm rounded-md object-cover`}
          wrapperClassName="h-full w-full"
          threshold={2500}
        />
      )}
      {imageError && (
        <div className="h-full w-full flex items-center justify-center bg-gray-200 rounded-md">
          <p className="text-gray-500">Failed to load image</p>
        </div>
      )}
    </AspectRatio>
  );
};

export default function CastEmbedImages({ images }) {
  const horizontalImages = images.filter((embed) => embed.metadata?.image?.width_px > embed.metadata?.image?.height_px);
  const verticalImages = images.filter((embed) => embed.metadata?.image?.width_px <= embed.metadata?.image?.height_px);

  return (
    <div className="">
      {(verticalImages.length === 0 && horizontalImages.length === 1) && (
        <ImageWithLazyLoad
          image={horizontalImages[0]}
          aspectRatio={horizontalImages[0].metadata.image.width_px / horizontalImages[0].metadata.image.height_px}
        />
      )}
      {(horizontalImages.length === 0 && verticalImages.length === 1) && (
        <ImageWithLazyLoad
          image={verticalImages[0]}
          aspectRatio={verticalImages[0].metadata.image.width_px / verticalImages[0].metadata.image.height_px > 2 / 3 ? verticalImages[0].metadata.image.width_px / verticalImages[0].metadata.image.height_px : 2 / 3}
        />
      )}
      {(horizontalImages.length === 2 && verticalImages.length === 0) && (
        <div className='flex flex-col gap-y-2'>
          {horizontalImages.map((image, index) => (
            <ImageWithLazyLoad
              key={image.url + index}
              image={image}
              aspectRatio={image.metadata.image.width_px / image.metadata.image.height_px}
            />
          ))}
        </div>
      )}
      {(verticalImages.length === 2 && horizontalImages.length === 0) && (
        <div className='flex flex-row gap-x-2'>
          {verticalImages.map((image, index) => (
            <ImageWithLazyLoad
              key={image.url + index}
              image={image}
              aspectRatio={3 / 2}
            />
          ))}
        </div>
      )}
      {(horizontalImages.length === 1 && verticalImages.length === 1) && (
        <div className='flex flex-row gap-x-2'>
          <ImageWithLazyLoad
            image={horizontalImages[0]}
            aspectRatio={1 / 1}
          />
          <ImageWithLazyLoad
            image={verticalImages[0]}
            aspectRatio={1 / 1}
          />
        </div>
      )}
    </div>
  );
}