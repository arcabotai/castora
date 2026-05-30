import { prisma } from '@/prisma/client'
import { SCHEDULED_CAST_STATUS } from '@prisma/client'
import { neynar } from '@/lib/neynar'

/**
 * Sends one-off scheduled casts (the `ScheduledCast` table, distinct from rich
 * Drafts). A cast is due when `status === PENDING` and `scheduledAt <= now`.
 *
 * v1 handles standalone casts only. Thread-grouped casts (`scheduledThreadId`
 * set) need ordered, parent-chained posting and are skipped here — see the
 * roadmap in AGENTS.md. Each cast is posted with an idempotency key, so a retry
 * of this worker won't double-post.
 *
 * Gated by the route behind CRON_SECRET + the CASTORA_ENABLE_SCHEDULED_SENDER
 * flag; this module never runs on import.
 */
export async function sendScheduledCasts() {
  const now = new Date()

  const dueCasts = await prisma.scheduledCast.findMany({
    where: {
      status: SCHEDULED_CAST_STATUS.PENDING,
      scheduledAt: { lte: now },
      scheduledThreadId: null, // standalone casts only (threads are a follow-up)
    },
    include: { SupercastFarcasterAccount: true },
  })

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const cast of dueCasts) {
    const account = cast.SupercastFarcasterAccount

    if (!account?.signerUUID) {
      skipped++
      console.warn(`sendScheduledCasts: cast ${cast.id} has no approved signer; skipping`)
      continue
    }

    // Neynar embeds: URL embeds as { url }, plus any recast/quote embeds stored
    // as JSON (already in Neynar's embed shape from the scheduling request).
    const embeds = [
      ...cast.embedURLs.map((url) => ({ url })),
      ...(Array.isArray(cast.embedRecasts) ? cast.embedRecasts : []),
    ]

    const castData = {
      text: cast.text,
      signer_uuid: account.signerUUID,
      parent: cast.parentURL || '',
      embeds,
      idem: cast.id.slice(0, 16),
    }

    try {
      await neynar.post('/v2/farcaster/cast/', castData)
      await prisma.scheduledCast.update({
        where: { id: cast.id },
        data: { status: SCHEDULED_CAST_STATUS.SUCCESS },
      })
      sent++
    } catch (error) {
      await prisma.scheduledCast.update({
        where: { id: cast.id },
        data: { status: SCHEDULED_CAST_STATUS.FAILED },
      })
      failed++
      console.error(`sendScheduledCasts: cast ${cast.id} failed:`, (error as Error).message)
    }
  }

  return { due: dueCasts.length, sent, failed, skipped }
}
