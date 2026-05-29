'use client'

import CastEmbedFrames from "./CastEmbedFrames"
import CastEmbedImages from "./CastEmbedImages"
import CastEmbedQuotes from "./CastEmbedQuotes"
import CastEmbedTweets from "./CastEmbedTweets"
import CastEmbedVideos from "./CastEmbedVideos"
import CastEmbedWebsites from "./CastEmbedWebsites"
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function CastEmbeds({ cast, withQuotes = true, isColumn = false }) {
  const [resolvedEmbeds, setResolvedEmbeds] = useState([]);

  useEffect(() => {
    const resolveEmbeds = async () => {
      const resolved = await Promise.all(
        cast.embeds.map(async (embed) => {
          if (embed.url && embed.url.startsWith('https://t.co/')) {
            const shortCode = embed.url.split('/').pop();
            try {
              const response = await axios.get(`/api/resolve-tco?code=${shortCode}`);
              return { ...embed, resolvedUrl: response.data.url };
            } catch (error) {
              console.error('Error resolving t.co URL:', error);
              return embed;
            }
          }
          return embed;
        })
      );
      setResolvedEmbeds(resolved);
    };

    resolveEmbeds();
  }, [cast.embeds]);

  const embedsWithMetadata = cast.embeds.filter((embed) => !!embed.metadata && !!embed.metadata.content_type)

  const images = embedsWithMetadata.filter((embed) => embed.metadata.content_type.startsWith('image'))
  const videos = embedsWithMetadata.filter((embed) => embed.metadata.content_type.startsWith('video') || embed.metadata.content_type.startsWith('application/x-mpegurl') || embed.metadata.content_type.startsWith('application/vnd.apple.mpegurl'))
  const quotesCastId = cast.embeds.filter((embed) => (!!embed.cast_id && !embed.cast))
  const quotesEmbedded = cast.embeds.filter((embed) => (!!embed.cast && embed.cast.object === "cast_embedded"))


  const tweets = resolvedEmbeds.filter((embed) =>
    (embed.resolvedUrl && (embed.resolvedUrl.includes('twitter.com') || embed.resolvedUrl.includes('x.com'))) ||
    (embed.url && (embed.url.includes('twitter.com') || embed.url.includes('x.com')))
  );

  const frames = cast.frames ? cast.frames : []

  // eliminate tweets and frames from websites if the embed.url is the same
  const websites = embedsWithMetadata
    .filter((embed) => embed.metadata.content_type.startsWith('text/html'))
    .filter((embed) => !tweets.find((tweet) => tweet.url === embed.url || tweet.resolvedUrl === embed.url))
    .filter((embed) => !frames.find((frame) => frame.frames_url === embed.url))
    .concat(
      resolvedEmbeds.filter((embed) =>
        embed.resolvedUrl &&
        !embed.resolvedUrl.includes('twitter.com') &&
        !embed.resolvedUrl.includes('x.com')
      ).map((embed) => ({ ...embed, url: embed.resolvedUrl }))
    )
    .filter((embed) => !embed.url.startsWith('https://t.co/'))

  return (
    <div className='flex flex-col gap-y-1'>
      {images.length > 0 && <CastEmbedImages images={images} />}
      {videos.length > 0 && <CastEmbedVideos videos={videos} />}
      {websites.length > 0 && <CastEmbedWebsites websites={websites} isColumn={isColumn} />}
      {(withQuotes && (quotesCastId.length > 0 || quotesEmbedded.length > 0)) && <CastEmbedQuotes quotesCastId={quotesCastId} quotesEmbedded={quotesEmbedded} isColumn={isColumn} />}
      {tweets.length > 0 && <CastEmbedTweets tweets={tweets} />}
      {frames.length > 0 && <CastEmbedFrames frames={frames} castHash={cast.hash} />}
    </div>
  )
}
