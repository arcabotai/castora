import axios from "axios"

export async function GET(req: Request) {

  const url = new URL(req.url)

  const address = url.searchParams.get("address")
  const season = url.searchParams.get("season")

  if (!address) {
    return Response.json({ "error": "No address provided" }, { status: 400 })
  }

  if (!season) {
    return Response.json({ "error": "No season provided" }, { status: 400 })
  }

  const response = await axios.get(`https://api.degen.tips/airdrop2/${season}/merkleproofs?wallet=${address}`);

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  console.log(response.data)

  return Response.json({ "data": response.data })
}
