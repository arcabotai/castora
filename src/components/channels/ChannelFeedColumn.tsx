import { useSelectedCast } from "@/providers/SelectedCastProvider";
import ChannelPreviewColumn from "../casts/DraftComposeWindow/ChannelPreviewColumn";
import CastDetailColumn from "../CastDetailColumn";

export default function ChannelFeedColumn() {

  const { hash: castHash, setHash } = useSelectedCast()

  if (!!castHash) {
    return <CastDetailColumn />
  }
}