import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/prisma/client'
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"

export async function GET(req: NextRequest) {
  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return NextResponse.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return NextResponse.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  try {
    // Get notification settings for the user and target FID
    const notificationSettings = await prisma.notificationSettings.findFirst({
      where: {
        supercastPrivyUserId: supercastUser.id,
        SupercastFarcasterAccount: {
          fid: targetFid
        }
      }
    })

    // If no settings found, return default values
    if (!notificationSettings) {
      return NextResponse.json({
        pushNotifications: false,
        priorityMode: false,
        replies: false,
        mentions: false
      })
    }

    // Return the settings with default being false
    return NextResponse.json({
      pushNotifications: notificationSettings.pushNotifications || false,
      priorityMode: notificationSettings.priorityMode || false,
      replies: notificationSettings.replies || false,
      mentions: notificationSettings.mentions || false
    })

  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { authenticated, supercastUser } = await isAuthenticated(req)

  if (!authenticated) {
    return NextResponse.json({ 'error': 'Not authenticated' }, { status: 401 })
  }

  const targetFid = Number(req.headers.get("asFid"))

  const { authorized } = await isAuthorized(supercastUser, targetFid)

  if (!authorized) {
    return NextResponse.json({ 'error': 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { pushNotifications, priorityMode, replies, mentions } = body

    // Get the FarcasterAccount for this FID
    const farcasterAccount = await prisma.supercastFarcasterAccount.findFirst({
      where: { fid: targetFid }
    })

    if (!farcasterAccount) {
      return NextResponse.json({ error: 'Farcaster account not found' }, { status: 404 })
    }

    // Update or create notification settings
    const settings = await prisma.notificationSettings.upsert({
      where: {
        supercastPrivyUserId_supercastFarcasterAccountId: {
          supercastPrivyUserId: supercastUser.id,
          supercastFarcasterAccountId: farcasterAccount.id
        }
      },
      update: {
        ...(pushNotifications !== undefined && { pushNotifications }),
        ...(priorityMode !== undefined && { priorityMode }),
        ...(replies !== undefined && { replies }),
        ...(mentions !== undefined && { mentions })
      },
      create: {
        supercastPrivyUserId: supercastUser.id,
        supercastFarcasterAccountId: farcasterAccount.id,
        pushNotifications: pushNotifications ?? true,
        priorityMode: priorityMode ?? true,
        replies: replies ?? true,
        mentions: mentions ?? true
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 })
  }
}