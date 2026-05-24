'use client'

// this privy function is client side only!!!!
import { getAccessToken } from "@privy-io/react-auth";
// the above makes this a client component!

import axios from "axios";
import { HOST_URL } from "./hostURL";
import { SupercastUserState } from "@/types";

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerNotificationSubscription(supercastUserState: SupercastUserState) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported');
  }

  try {
    // First ensure we have an active service worker
    let registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      console.log('Registering new service worker...');
      registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
    }

    // Wait for the service worker to be ready and active
    if (!registration.active) {
      console.log('Waiting for service worker to become active...');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Service Worker activation timeout'));
        }, 10000); // 10 second timeout

        if (registration.installing) {
          registration.installing.addEventListener('statechange', (e: Event) => {
            if ((e.target as ServiceWorker).state === 'activated') {
              clearTimeout(timeout);
              resolve();
            }
          });
        } else if (registration.waiting) {
          registration.waiting.addEventListener('statechange', (e: Event) => {
            if ((e.target as ServiceWorker).state === 'activated') {
              clearTimeout(timeout);
              resolve();
            }
          });
        } else {
          clearTimeout(timeout);
          reject(new Error('No installing or waiting service worker found'));
        }
      });
    }

    // Verify we have an active service worker before continuing
    if (!registration.active) {
      throw new Error('No active service worker found');
    }

    let sub = await registration.pushManager.getSubscription();
    console.log('Existing subscription:', sub);
    
    if (!sub) {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      console.log('New notification subscription:', sub);
    }

    if (!sub || !sub.endpoint) {
      throw new Error('Failed to create valid push subscription');
    }

    const accessToken = await getAccessToken();
    const response = await axios.post(`${HOST_URL}/api/notifications/subscribe`, {
      subscription: sub
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    });

    if (!response.data.success) {
      throw new Error('Failed to store subscription on server');
    }

    return true;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    throw error;
  }
}
