import { NextRequest, NextResponse } from "next/server";

import { isNeynarWebhook } from "@/utils/auth/isNeynarWebhook";
import { sendNotification } from "../pushnotifications";
import { prisma } from "@/prisma/client";
import { HOST_URL } from "@/utils/hostURL";
import axios from "axios";
import { neynar } from '@/lib/neynar'
import Redis from 'ioredis';

let redis: Redis | null = null;
const WEBHOOK_DEDUPE_TTL_SECONDS = 60 * 60 * 24;

const getRedis = () => {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, { lazyConnect: true });
  }
  return redis;
}

const webhookIdempotencyKey = (data: any) => {
  const eventType = data?.type || 'unknown';
  const eventId = data?.event_id || data?.id;
  const castHash = data?.data?.hash;
  const timestamp = data?.data?.event_timestamp || data?.created_at;

  return `neynar:webhook:${eventType}:${eventId || castHash || timestamp || JSON.stringify(data).slice(0, 128)}`;
}

const claimWebhookEvent = async (data: any): Promise<boolean> => {
  const redisClient = getRedis();
  if (!redisClient) return true;

  const result = await redisClient.set(
    webhookIdempotencyKey(data),
    '1',
    'EX',
    WEBHOOK_DEDUPE_TTL_SECONDS,
    'NX'
  );

  return result === 'OK';
}

export async function POST(req: NextRequest) {
  try{
    // validate Webhook siganture from Neynar and get webhookData
    const { success, data } = await isNeynarWebhook(req);
    if(!success) { 
      return NextResponse.json({ error: 'Failed to validate webhook signature' }, { status: 401 });
    }

    const shouldProcess = await claimWebhookEvent(data);
    if (!shouldProcess) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    // debug output all neynar data including unrolling objects
    // console.dir(data, {depth: null});

    if (data.type === 'cast.created') {
      const cast = data.data;
      const authorHasPowerBadge = cast.author.power_badge === true;
      
      // If this is a reply, notify the parent author
      if (cast.parent_author?.fid) {
        let fid = cast.parent_author.fid;
        let subscriptions = await prisma.notificationSubscription.findMany({
          where: {
            SupercastPrivyUser: {
              NotificationSettings: {
                some: {
                  SupercastFarcasterAccount: {
                    fid,
                  },
                  pushNotifications: true,
                  replies: true,
                }
              }
            }
          },
          select: {
            subscriptionObject: true,
            SupercastPrivyUser: {
              select: {
                NotificationSettings: {
                  where: {
                    SupercastFarcasterAccount: { fid },
                  },
                  select: {
                    priorityMode: true
                  }
                }
              }
            }
          }
        });

        // Filter out subscriptions where priorityMode is true but author doesn't have power badge
        subscriptions = subscriptions.filter(sub => {
          const settings = sub.SupercastPrivyUser.NotificationSettings[0];
          return !settings.priorityMode || (settings.priorityMode && authorHasPowerBadge);
        });

        // Continue with sending notifications if any subscriptions remain
        if (subscriptions.length > 0) {
          const res = await neynar.get(`/v2/farcaster/user/bulk/?fids=${fid}`
          );
          const username = res.data.users[0].username;
          const message = `${cast.author.display_name} (@${cast.author.username}) replied: ${cast.text}`;
          const url = `${HOST_URL}/c/${cast.hash}`
          const result = await sendNotification(subscriptions, username, message, url);
          if (!result.success) {
            return NextResponse.json({ error: 'Failed to send notification to parent author' }, { status: 500 });
          }
        }
      }

      // If there are mentioned profiles, notify them
      if (cast.mentioned_profiles && cast.mentioned_profiles.length > 0) {
        for (const profile of cast.mentioned_profiles) {
          let fid = profile.fid;
          let subscriptions = await prisma.notificationSubscription.findMany({
            where: {
              SupercastPrivyUser: {
                NotificationSettings: {
                  some: {
                    SupercastFarcasterAccount: {
                      fid,
                    },
                    pushNotifications: true,
                    mentions: true,
                  }
                }
              }
            },
            select: {
              subscriptionObject: true,
              SupercastPrivyUser: {
                select: {
                  NotificationSettings: {
                    where: {
                      SupercastFarcasterAccount: { fid },
                    },
                    select: {
                      priorityMode: true
                    }
                  }
                }
              }
            }
          });

          // Filter out subscriptions where priorityMode is true but author doesn't have power badge
          subscriptions = subscriptions.filter(sub => {
            const settings = sub.SupercastPrivyUser.NotificationSettings[0];
            return !settings.priorityMode || (settings.priorityMode && authorHasPowerBadge);
          });
          
          if (subscriptions.length > 0) {
            const message = `${cast.author.display_name} (@${cast.author.username}) mentioned you: ${cast.text}`;
            const url = `${HOST_URL}/c/${cast.hash}`
            const result = await sendNotification(subscriptions, profile.username, message, url);
            if (!result.success) {
              return NextResponse.json({ error: 'Failed to send notification to mentioned user' }, { status: 500 });
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('/api/notifications/webhook', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** cast.created sample subscription 
 *  NEYNAR WEBHOOK call
{
  created_at: 1730637750,
  type: 'cast.created',
  data: {
    object: 'cast',
    hash: '0xec4f8c6ba4cec8a15d3a17091d74c895bff28c6d',
    author: {
      object: 'user',
      fid: 12626,
      username: 'lampphotography',
      display_name: 'Lauren McDonagh-Pereira ',
      pfp_url: 'https://i.imgur.com/v9Sk7SF.jpg',
      custody_address: '0x3242bb7425a3a4273faa188c6da396c8de327ee3',
      profile: {
        bio: {
          text: 'Photographer. Artist. Web3 Blogger. \n' +
            'seemore.tv/lampphotography\n' +
            'nftartwithlauren.com '
        },
        location: {
          latitude: 42.36,
          longitude: -71.06,
          address: {
            city: 'Boston',
            state: 'Massachusetts',
            state_code: 'ma',
            country: 'United States of America',
            country_code: 'us'
          }
        }
      },
      follower_count: 14291,
      following_count: 2724,
      verifications: [ '0xae412a9b9ad78c93a0253c86e617bf193bbccacd' ],
      verified_addresses: {
        eth_addresses: [ '0xae412a9b9ad78c93a0253c86e617bf193bbccacd' ],
        sol_addresses: []
      },
      verified_accounts: [ { platform: 'x', username: 'LAMPphotography' } ],
      power_badge: true
    },
    thread_hash: '0x3b0fcfe57082e9fc44ab00ad33453aa3256bc163',
    parent_hash: '0x3b0fcfe57082e9fc44ab00ad33453aa3256bc163',
    parent_url: null,
    root_parent_url: 'https://warpcast.com/~/channel/someone-build',
    parent_author: { fid: 16085 },
    text: 'That would be cool. Especially with a helpful "what time is it there" feature',
    timestamp: '2024-11-03T12:42:30.000Z',
    embeds: [],
    channel: {
      object: 'channel_dehydrated',
      id: 'someone-build',
      name: 'someone-build',
      image_url: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/63906b1b-8db7-4a03-809d-75a243665500/original'
    },
    reactions: { likes_count: 0, recasts_count: 0, likes: [], recasts: [] },
    replies: { count: 0 },
    mentioned_profiles: [],
    author_channel_context: { following: false },
    event_timestamp: '2024-11-03T12:42:30.424Z'
  }
}
*/