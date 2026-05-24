import React from 'react';
import ReactPlayer from 'react-player';
import { Card } from "@/components/ui/card";

const VideoPreview = ({ embed }) => {
  const { url, metadata } = embed;
  const { video } = metadata;

  return (
    <Card className="w-full overflow-hidden">
      <div className='rounded-md w-full aspect-video'>
        <ReactPlayer
          url={url}
          width="100%"
          height="100%"
          controls={true}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
        />
      </div>
    </Card>
  );
};

const CastEmbedVideos = ({ videos }) => {
  return (
    <div className="flex flex-col gap-y-2">
      {videos.map((embed, index) => (
        <VideoPreview key={embed.url + index} embed={embed} />
      ))}
    </div>
  );
};

export default CastEmbedVideos;