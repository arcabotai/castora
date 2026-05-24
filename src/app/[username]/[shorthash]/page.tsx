import { HOST_URL } from '@/utils/hostURL'
import axios from 'axios'
import { redirect } from "next/navigation"

export default async function Page({ params }: { params: { username: string, shorthash: string } }) {

  const username = params.username
  const shorthash = params.shorthash

  const response = await axios.get(`${HOST_URL}/api/url-preview/warpcast?query=https://warpcast.com/${username}/${shorthash}`)

  const cast = response.data.cast

  if (!!cast) {
    redirect(`/c/${cast.hash}`)
  }
}
