const APP_CAST_LINK_PATTERN = /^https?:\/\/(?:www\.)?(?:castora\.arcabot\.ai|super\.sc)\/c\/(0x[0-9a-fA-F]+)(?:[/?#].*)?$/i

export function getCastHashFromAppUrl(url: string) {
  const match = url.match(APP_CAST_LINK_PATTERN)
  return match?.[1] || null
}
