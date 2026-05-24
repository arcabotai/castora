import axios from "axios"

export async function GET(req: Request) {

  const url = new URL(req.url)

  const address = url.searchParams.get("address")
  const season = url.searchParams.get("season") || "current"

  if (!address) {
    return Response.json({ "points": 0 })
  }

  const response = await axios.get(`https://api.degen.tips/airdrop2/${season}/points?wallet=${address}`);

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  if (response.data.length === 0) {
    return Response.json({ "points": 0 })
  }

  return Response.json({ "points": response.data[0].points })
}
