import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/prisma/client'
import { isAuthenticated } from "@/utils/auth/isAuthenticated"
import { isAuthorized } from "@/utils/auth/isAuthorized"
import axios from 'axios'
import { HOST_URL } from '@/utils/hostURL'

async function subscribeFIDToNeynarWebhookCastCreated(
  fid: number,
  options?: {
    excludeAuthorFids?: boolean,
    authorFids?: boolean,
    mentionedFids?: boolean,
    parentAuthorFids?: boolean,
  }
) {
  try {
    const subscription = {
      'cast.created': {
        ...(options?.excludeAuthorFids && { exclude_author_fids: [fid] }),
        ...(options?.authorFids && { author_fids: [fid] }),
        ...(options?.mentionedFids && { mentioned_fids: [fid] }),
        ...(options?.parentAuthorFids && { parent_author_fids: [fid] }),
      }
    };

    const response = await axios.put(
      'https://api.neynar.com/v2/farcaster/webhook',
      {
        subscription,
        name: `${process.env.NEYNAR_NOTIFICATION_WEBHOOK_NAME}`,
        url: `${HOST_URL}/api/notifications/webhook`,
        webhook_id: process.env.NEYNAR_NOTIFICATION_WEBHOOK_ID
      },
      {
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'x-api-key': process.env.NEYNAR_API_KEY
        }
      }
    );

    if (response.status !== 200) {
      throw new Error('Failed to subscribe to Neynar webhook');
    }

    return { success: true };
  } catch (error) {
    console.error('Error subscribing to Neynar webhook:', error);
    return { success: false, error: 'Failed to subscribe to webhook' };
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

  const { subscription } = await req.json()

  // Extract only the necessary fields from the PushSubscription
  const subscriptionForDb = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    }
  }

  try {
    // Check if subscription already exists for this user and endpoint
    const existingSubscription = await prisma.notificationSubscription.findFirst({
      where: {
        supercastPrivyUserId: supercastUser.id,
        subscriptionObject: {
          path: ['endpoint'],
          string_contains: subscription.endpoint
        }
      }
    })

    // Get the FarcasterAccount for this FID
    const farcasterAccount = await prisma.supercastFarcasterAccount.findFirst({
      where: { fid: targetFid }
    })

    if (!farcasterAccount) {
      return NextResponse.json({ error: 'Farcaster account not found' }, { status: 404 })
    }

    // sign user up on neynar webhooks for mentions & replies
    await subscribeFIDToNeynarWebhookCastCreated(targetFid, { mentionedFids: true, parentAuthorFids: true })

    console.log('/subscribe db TX',)
    // Start a transaction to ensure both operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // only store if we don't already track this endpoint
      if (!existingSubscription) {
        await tx.notificationSubscription.create({
          data: {
            supercastPrivyUserId: supercastUser.id,
            subscriptionObject: JSON.parse(JSON.stringify(subscriptionForDb))
          }
        })
      }

      // Create default notification settings if they don't exist
      await tx.notificationSettings.upsert({
        where: {
          supercastPrivyUserId_supercastFarcasterAccountId: {
            supercastPrivyUserId: supercastUser.id,
            supercastFarcasterAccountId: farcasterAccount.id
          }
        },
        update: {
          pushNotifications: true
        }, // Don't update if exists
        create: {
          supercastPrivyUserId: supercastUser.id,
          supercastFarcasterAccountId: farcasterAccount.id,
          pushNotifications: true,
          priorityMode: true,
          replies: true,
          mentions: true
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error storing push subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to store subscription' },
      { status: 500 }
    )
  }
}

