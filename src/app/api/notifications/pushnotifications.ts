'use server'

import webpush from 'web-push'
import { prisma } from '@/prisma/client'
import { Prisma } from '@prisma/client';

let vapidConfigured = false;

const ensureVapidDetails = () => {
  if (vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.warn('Push notifications disabled: VAPID keys are not configured');
    return false;
  }

  webpush.setVapidDetails(
    'mailto:hello@castora.social',
    publicKey,
    privateKey
  );
  vapidConfigured = true;
  return true;
}

// sends notification to all subscriptions, no validation on settings
// @dev the caller is expected to verify notification settings before calling
export async function sendNotification(
  subscriptions: { subscriptionObject: Prisma.JsonValue; }[],
  title: string,
  message: string,
  pushUrl: string = "https://castora.social",
) {
  try {
    if (!ensureVapidDetails()) {
      return { success: false, error: 'Push notifications are not configured' }
    }

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
    if (!ensureVapidDetails()) {
      return { success: false, error: 'Push notifications are not configured' }
    }

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