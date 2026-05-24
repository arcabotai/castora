import { PostHog } from 'posthog-node'

type POSTHOG_EVENT_TYPE =
  'cast_sent'
  | 'cast_bookmarked'
  | 'cast_deleted'
  | 'cast_scheduled'
  | 'cast_unscheduled'
  | 'draft_created'
  | 'cast_sent_fail'
  | 'account_shared'
  | 'account_shared_removed'
  | 'account_connected'
  | 'account_disconnected'
  | 'account_created'
  | 'subscription_started'
  | 'subscription_renewed'
  | 'subscription_ended'
  | 'payment_received'
  | 'refund_requested'
  | 'boost_request_sent'
  | 'reaction_scheduled'
  | 'scheduled_reaction_sent'
  | 'scheduled_reaction_sent_fail'
  | 'feed_refreshed'
  | 'notifications_refreshed'
  | 'cast_liked'
  | 'cast_recasted'
  | 'moxie_daily_reward_request'
  | 'cast_searched'
  | 'moxie_cast_stats_viewed'
  | 'list_created'
  | 'list_followed'
  | 'auth_error'
  | 'waitlist_signup'
  | 'storage_purchased'
  | 'registration_purchased'
  | 'membership_purchased'

export const trackPosthogEvent = async (fid: Number, eventType: POSTHOG_EVENT_TYPE, eventProperties: Object) => {

  const posthog_client = new PostHog(
    process.env.NEXT_PUBLIC_POSTHOG_KEY as string,
    {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    }
  )

  posthog_client.capture({
    distinctId: fid.toString(),
    event: eventType,
    properties: {
      ...eventProperties,
      "supercast_secret": "ilovesupercast", // leaving this here in case someone tries to spam our posthog
    },
  })

  await posthog_client.shutdown() // On program exit, call shutdown to stop pending pollers and flush any remaining events
}