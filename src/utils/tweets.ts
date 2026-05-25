type TweetWithEntities = {
  entities?: unknown
  quoted_tweet?: unknown
  parent?: unknown
}

const emptyArrayKeys = ['hashtags', 'urls', 'user_mentions', 'symbols', 'media'] as const

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

export function sanitizeTweetForReactTweet<T extends TweetWithEntities>(tweet: T): T {
  const mutableTweet = tweet as T & { entities: Record<string, unknown> }
  const entities = asRecord(tweet.entities)

  for (const key of emptyArrayKeys) {
    entities[key] = asArray(entities[key])
  }

  mutableTweet.entities = entities

  if (tweet.quoted_tweet && typeof tweet.quoted_tweet === 'object') {
    sanitizeTweetForReactTweet(tweet.quoted_tweet as TweetWithEntities)
  }

  if (tweet.parent && typeof tweet.parent === 'object') {
    sanitizeTweetForReactTweet(tweet.parent as TweetWithEntities)
  }

  return tweet
}
