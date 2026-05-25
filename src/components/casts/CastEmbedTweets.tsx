import Tweet from "../tweet/tweet"

export default function CastEmbedTweets({ tweets }) {
  const TweetPattern = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?:\w+)\/status\/(\d+)/;

  const tweetIds = (Array.isArray(tweets) ? tweets : []).map((embed) => {
    const url = embed.resolvedUrl || embed.url;
    if (typeof url !== 'string') {
      return null
    }
    const match = url.match(TweetPattern);
    return match ? match[1] : null;
  }).filter((id, index, ids) => Boolean(id) && ids.indexOf(id) === index);

  return (
    <div className="flex flex-col gap-y-2">
      {tweetIds.map((id) => (
        <Tweet key={id} id={id} />
      ))}
    </div>
  )
}
