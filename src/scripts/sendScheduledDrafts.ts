import { prisma } from '@/prisma/client'
import { DRAFT_SEND_STATUS } from '@prisma/client'
import { sendDraftToFarcaster } from '@/utils/drafts'

/**
 * Sends scheduled Drafts whose time has come.
 *
 * A Draft is due when `sendStatus === SCHEDULED` and `nextScheduledAt <= now`.
 * `sendDraftToFarcaster` does the heavy lifting: it posts via Neynar, fires any
 * scheduled reactions, advances `nextScheduledAt` for recurring drafts (or marks
 * one-offs SENT), and flips the draft to ERROR on failure — so this worker just
 * selects the due rows and delegates. Failures are isolated per draft.
 *
 * Gated by the route behind CRON_SECRET + the CASTORA_ENABLE_SCHEDULED_SENDER
 * flag; this module never runs on import.
 */
export async function sendScheduledDrafts() {
  const now = new Date()

  const dueDrafts = await prisma.draft.findMany({
    where: {
      sendStatus: DRAFT_SEND_STATUS.SCHEDULED,
      nextScheduledAt: { lte: now },
    },
    include: {
      author: true,
      creator: true,
      parentDraft: true,
      replyDraft: true,
    },
  })

  let sent = 0
  let failed = 0

  for (const draft of dueDrafts) {
    try {
      await sendDraftToFarcaster(draft)
      sent++
    } catch (error) {
      failed++
      console.error(`sendScheduledDrafts: draft ${draft.id} failed:`, (error as Error).message)
    }
  }

  return { due: dueDrafts.length, sent, failed }
}
