import axios from "axios"

export async function GET(req: Request) {

  const url = new URL(req.url)

  const query = url.searchParams.get("query")

  const response = await axios.get(`https://api.neynar.com/v2/farcaster/cast?type=url&identifier=${query}`, { "headers": { "api_key": process.env.NEYNAR_API_KEY } })

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  return Response.json({ "cast": response.data.cast })
}
