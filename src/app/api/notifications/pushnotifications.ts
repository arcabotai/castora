'use server'

import webpush from 'web-push'
import { prisma } from '@/prisma/client'
import { Prisma } from '@prisma/client';

webpush.setVapidDetails(
  'mailto:test@super.sc',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// sends notification to all subscriptions, no validation on settings
// @dev the caller is expected to verify notification settings before calling
export async function sendNotification(
  subscriptions: { subscriptionObject: Prisma.JsonValue; }[],
  title: string,
  message: string,
  pushUrl: string = "https://castora.arcabot.ai",
) {
  try {
    if (!subscriptions) {
      throw new Error('No subscription available')
    }

    for (const sub of subscriptions) {
      try {
        console.log('sendNotification: title', title, 'message: ', message, 'url: ', pushUrl, 'to subscription: ', sub.subscriptionObject)
        await webpush.sendNotification(
          sub.subscriptionObject,
          JSON.stringify({
            title: title,
            body: message,
            timestamp: Date.now(),
            data: {
              url: pushUrl
            }
          })
        );
      } catch (error) {
        console.log(error)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}

// send arbitrary notification to all PushNotification enabled subscriptions for that FID
export async function sendNotificationForFid(fid: number, title: string, message: string, pushUrl: string) {
  try {
    let subscriptions = await prisma.notificationSubscription.findMany({
      where: {
        SupercastPrivyUser: {
          NotificationSettings: {
            some: {
              SupercastFarcasterAccount: {
                fid,
              },
              // ensures user has push notifications on for that FID
              pushNotifications: true,
            }
          }
        }
      },
      select: {
        subscriptionObject: true,
      }
    });

    if (!subscriptions) {
      throw new Error('No subscription available')
    }

    for (const sub of subscriptions) {
      await webpush.sendNotification(
        sub.subscriptionObject,
        JSON.stringify({
          title: title,
          body: message,
          timestamp: Date.now(),
          data: {
            url: pushUrl
          }
        })
      );
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}