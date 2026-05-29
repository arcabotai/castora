import axios from "axios"
import { neynar } from '@/lib/neynar'
import { prisma } from '@/prisma/client'
import { isAuthenticated } from "@/utils/auth/isAuthenticated";
import { isAuthorized } from "@/utils/auth/isAuthorized";
import { trackPosthogEvent } from "@/utils/posthogAnalytics";
import { redis } from '@/utils/redis'

const PAGE_SIZE = 20
const CACHE_TTL = 60 * 60 // 1 hour in seconds

// Initialize Redis client

export async function GET(req: Request) {

  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return Response.json({ "error": "Not authenticated" }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid")) || Number(process.env.DEFAULT_GUEST_USER_FID)
  const isGuestUser = targetFid === Number(process.env.DEFAULT_GUEST_USER_FID)

  const url = new URL(req.url)

  const cursor = url.searchParams.get("cursor")
  const listId = url.searchParams.get("listID")
  const with_recasts = url.searchParams.get("include_recasts")

  // following or trending
  if (listId === "following") {

    trackPosthogEvent(supercastUser.fid, "feed_refreshed", {
      "type": "following",
      "asFid": targetFid,
    })

    const response = await neynar.get(`/v2/farcaster/feed/?feed_type=following&fid=${targetFid}&limit=${PAGE_SIZE}&cursor=${cursor}&with_recasts=false`)

    if (response.status !== 200) {
      return Response.json(response.data.casts, { status: response.status })
    }

    return Response.json({ "casts": response.data.casts, "cursor": response.data.next.cursor })
  }

  if (listId === "foryou") {

    trackPosthogEvent(supercastUser.fid, "feed_refreshed", {
      "type": "for_you",
      "asFid": targetFid,
    })

    // Check cache for guest user
    if (isGuestUser) {
      const cacheKey = `feed:foryou:${cursor || 'initial'}`
      const cachedDataString = await redis.get(cacheKey)
      const cachedData = cachedDataString ? JSON.parse(cachedDataString) : null

      if (cachedData) {
        return Response.json(cachedData)
      }
    }

    const response = await neynar.get(`/v2/farcaster/feed/for_you/?fid=${targetFid}&viewer_fid=${targetFid}&provider=openrank&limit=${PAGE_SIZE}&cursor=${cursor}`)

    if (response.status !== 200 && response.status !== 206) {
      return Response.json("error", { status: response.status })
    }

    const responseData = {
      "casts": response.data.casts,
      "cursor": response.data.next.cursor
    }

    // Cache response for guest user
    if (isGuestUser) {
      const cacheKey = `feed:foryou:${cursor || 'initial'}`
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(responseData))
    }

    return Response.json(responseData)
  }

  if (listId === "trending") {

    trackPosthogEvent(supercastUser.fid, "feed_refreshed", {
      "type": "trending",
      "asFid": targetFid,
    })

    // Check cache for guest user
    if (isGuestUser) {
      const cacheKey = `feed:trending:${cursor || 'initial'}`
      const cachedDataString = await redis.get(cacheKey)
      const cachedData = cachedDataString ? JSON.parse(cachedDataString) : null

      if (cachedData) {
        return Response.json(cachedData)
      }
    }

    const response = await neynar.get(`/v2/farcaster/feed/?feed_type=filter&filter_type=global_trending&viewer_fid=${targetFid}&limit=${PAGE_SIZE}&cursor=${cursor}`)

    if (response.status !== 200) {
      return Response.json(response.data, { status: response.status })
    }

    const responseData = {
      "casts": response.data.casts,
      "cursor": response.data.next.cursor
    }

    // Cache response for guest user
    if (isGuestUser) {
      const cacheKey = `feed:trending:${cursor || 'initial'}`
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(responseData))
    }

    return Response.json(responseData)
  }

  if (listId === "anon") {
    trackPosthogEvent(supercastUser.fid, "feed_refreshed", {
      "type": "anon",
      "asFid": targetFid,
    })

    const response = await neynar.get(`/v2/farcaster/feed/?feed_type=filter&filter_type=fids&fids=862100&limit=${PAGE_SIZE}&viewer_fid=${targetFid}&cursor=${cursor}`)

    if (response.status !== 200) {
      return Response.json(response.data, { status: response.status })
    }

    return Response.json({ "casts": response.data.casts, "cursor": response.data.next.cursor })
  }


  const listMemberFids = await prisma.listMembership.findMany({
    where: {
      listId: listId,
    },
    select: {
      memberFid: true,
    }
  }).then((listMemberships) => {
    return listMemberships.map((listMembership: any) => listMembership.memberFid)
  })

  if (listMemberFids.length === 0) {
    return Response.json({ "casts": [], "cursor": null })
  }

  trackPosthogEvent(supercastUser.fid, "feed_refreshed", {
    "type": "list",
    "listId": listId,
    "asFid": targetFid,
  })

  const response = await neynar.get(`/v2/farcaster/feed/?feed_type=filter&filter_type=fids&fids=${listMemberFids.join(",")}&with_recasts=${with_recasts}&limit=${PAGE_SIZE}&viewer_fid=${targetFid}&cursor=${cursor}`)

  if (response.status !== 200) {
    return Response.json(response.data, { status: response.status })
  }

  const castsWithAuthorInfo = response.data.casts.map((cast: any) => {
    const isAuthorInList = listMemberFids.includes(cast.author.fid)
    return {
      ...cast,
      isAuthorInList,
    }
  })

  return Response.json({
    "casts": castsWithAuthorInfo,
    "cursor": response.data.next.cursor
  })
}
