import axios from "axios"

export async function GET(req: Request) {

  const url = new URL(req.url)

  const username = url.searchParams.get("username")
  let profileFid = url.searchParams.get("fid")

  const targetFid = Number(req.headers.get("asFid"))

  if (!profileFid && username.startsWith("!")) {
    profileFid = username.slice(1)
  }

  if (!profileFid && !username) {
    return Response.json({ "error": "Missing fid or username" }, { status: 400 })
  }

  if (!!profileFid) {

    try {
      const response = await axios.get(`https://api.neynar.com/v2/farcaster/user/bulk/?fids=${profileFid}${targetFid ? `&viewer_fid=${targetFid}` : ""}`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

      if (response.status !== 200) {
        return Response.json(response.data, { status: response.status })
      }

      return Response.json({ "user": response.data.users[0] })
    } catch (error) {
      return Response.json({ "error": "User not found" }, { status: 404 })
    }
  }

  if (!!username) {

    try {
      const response = await axios.get(`https://api.neynar.com/v2/farcaster/user/by_username/?username=${username}${targetFid ? `&viewer_fid=${targetFid}` : ""}`, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

      if (response.status !== 200) {
        return Response.json(response.data, { status: response.status })
      }

      return Response.json({ "user": response.data.user })
    } catch (error) {
      return Response.json({ "error": "User not found" }, { status: 404 })
    }
  }
}
