type TweetWithEntities = {
  entities?: unknown
  quoted_tweet?: unknown
  parent?: unknown
  text?: unknown
  display_text_range?: unknown
}

const requiredArrayKeys = ['hashtags', 'urls', 'user_mentions', 'symbols'] as const

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function normalizeRange(value: unknown, textLength: number): [number, number] | null {
  if (!Array.isArray(value) || value.length < 2) {
    return null
  }

  const start = Number(value[0])
  const end = Number(value[1])

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null
  }

  const safeStart = Math.max(0, Math.min(Math.floor(start), textLength))
  const safeEnd = Math.max(safeStart, Math.min(Math.floor(end), textLength))

  return [safeStart, safeEnd]
}

function cleanEntityArray(value: unknown, textLength: number) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entity) => {
      const record = asRecord(entity)
      const indices = normalizeRange(record.indices, textLength)

      if (!indices) {
        return null
      }

      return {
        ...record,
        indices,
      }
    })
    .filter(Boolean)
}

export function sanitizeTweetForReactTweet<T extends TweetWithEntities>(tweet: T): T {
  const mutableTweet = tweet as T & {
    entities: Record<string, unknown>
    text: string
    display_text_range: [number, number]
  }
  const text = typeof tweet.text === 'string' ? tweet.text : ''
  const textLength = Array.from(text).length
  const entities = asRecord(tweet.entities)

  mutableTweet.text = text
  mutableTweet.display_text_range = normalizeRange(tweet.display_text_range, textLength) || [0, textLength]

  for (const key of requiredArrayKeys) {
    entities[key] = cleanEntityArray(entities[key], textLength)
  }

  const media = cleanEntityArray(entities.media, textLength)
  if (media.length > 0) {
    entities.media = media
  } else {
    delete entities.media
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
