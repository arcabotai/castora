import axios from "axios"
import { Cast } from "@/types"

export async function GET(req: Request) {

  const targetFid = Number(req.headers.get("asFid"))

  const url = new URL(req.url)

  const hash = url.searchParams.get("hash")

  try {

    const response = await axios.get(`https://api.neynar.com/v2/farcaster/cast/?type=hash&identifier=${hash}${!!targetFid ? `&viewer_fid=${targetFid}` : ""}`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

    return Response.json({ "currentCast": response.data.cast })

  } catch (error) {
    return Response.json({ "error": error }, { status: error.response.status })
  }
}
