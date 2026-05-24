import Recast from "./Recast"
import RecastEmbedded from "./RecastEmbedded"

export default function CastEmbedQuotes({ quotesCastId, quotesEmbedded, isColumn }) {

  return (
    <div className="flex flex-col gap-y-2">
      {/* leaving old recast rendering in case something breaks. old version has power badge, new version does not */}
      {quotesCastId.map((embed, index) => (
        <Recast key={embed.cast_id.hash + index} hash={embed.cast_id.hash} isColumn={isColumn} />
      ))}
      {quotesEmbedded.map((embed, index) => (
        <RecastEmbedded key={embed.hash + index} cast={embed.cast} isColumn={isColumn} />
      ))}
    </div>
  )
}
