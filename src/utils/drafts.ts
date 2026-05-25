import { prisma } from "@/prisma/client";
import { trackPosthogEvent } from "@/utils/posthogAnalytics";
import { DRAFT_RECURRING_SCHEDULE, DRAFT_SEND_STATUS, Draft, REACTION_TYPE, SCHEDULED_REACTION_STATUS, ScheduledReaction, SupercastFarcasterAccount, SupercastPrivyUser } from "@prisma/client";
import axios from "axios";
import { isValidAnonPost } from "./anon/moderation";

interface DraftFull extends Draft {
  author: SupercastFarcasterAccount;
  creator: SupercastPrivyUser;
  parentDraft?: Draft;
  replyDraft?: Draft;
}

interface ScheduledReactionWithDraftAndAuthor extends ScheduledReaction {
  reactionAuthor: SupercastFarcasterAccount;
  draft: Draft;
}

const sendReactionToFarcaster = async (reaction: ScheduledReactionWithDraftAndAuthor, retryCount: number) => {

  const retrySendReactionToFarcaster = async (error) => {

    trackPosthogEvent(reaction.reactionAuthor.fid, "scheduled_reaction_sent_fail", {
      reactionId: reaction.id,
      retryCount: retryCount,
      error: error.response ? error.response.data.message : error.message,
    })

    if (!!error.response) {
      console.log(`Neynar error on retry ${retryCount}. Status: ${error.response.status}. Message: ${error.response.data.code} | ${error.response.data.message}`);
    } else {
      console.log(`Unknown error on retry ${retryCount}.`, error.message);
    }
    console.log(`Failed to send reaction ${reaction.text ? reaction.text.slice(0, 24) : reaction.reaction}... from user ${reaction.reactionAuthor.fid} on retry ${retryCount}. Retrying in 5 seconds.`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await sendReactionToFarcaster(reaction, retryCount + 1)
  }

  if (retryCount > 3) {
    console.log(`Failed to send reaction ${reaction.text ? reaction.text.slice(0, 24) : reaction.reaction}... from user ${reaction.reactionAuthor.fid} on retry ${retryCount}. Retry limit reached.`);

    const updatedReaction = await prisma.scheduledReaction.update({
      where: {
        id: reaction.id,
      },
      data: {
        sendStatus: SCHEDULED_REACTION_STATUS.FAILED,
      },
    })
    return;
  }

  if (reaction.reaction === REACTION_TYPE.LIKE) {

    const reactionData = {
      "reaction_type": "like",
      "target": reaction.draft.castHash,
      "signer_uuid": reaction.reactionAuthor.signerUUID,
    }

    await axios.post(`https://api.neynar.com/v2/farcaster/reaction/`, reactionData, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })
      .then(async (response) => {

        const updatedReaction = await prisma.scheduledReaction.update({
          where: {
            id: reaction.id,
          },
          data: {
            sendStatus: SCHEDULED_REACTION_STATUS.SUCCESS,
          },
        })

        console.log(`Successfully sent reaction ${reaction.text ? reaction.text.slice(0, 24) : reaction.reaction}... from user ${reaction.reactionAuthor.fid}.`);

        trackPosthogEvent(reaction.reactionAuthor.fid, "scheduled_reaction_sent", {
          reactionId: updatedReaction.id,
        })
      })
      .catch(async (error) => {
        retrySendReactionToFarcaster(error);
      });

  } else if (reaction.reaction === REACTION_TYPE.RECAST) {

    const reactionData = {
      "reaction_type": "recast",
      "target": reaction.draft.castHash,
      "signer_uuid": reaction.reactionAuthor.signerUUID,
    }

    await axios.post(`https://api.neynar.com/v2/farcaster/reaction/`, reactionData, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })
      .then(async (response) => {

        const updatedReaction = await prisma.scheduledReaction.update({
          where: {
            id: reaction.id,
          },
          data: {
            sendStatus: SCHEDULED_REACTION_STATUS.SUCCESS,
          },
        })

        console.log(`Successfully sent reaction ${reaction.text ? reaction.text.slice(0, 24) : reaction.reaction}... from user ${reaction.reactionAuthor.fid}.`);

        trackPosthogEvent(reaction.reactionAuthor.fid, "scheduled_reaction_sent", {
          reactionId: updatedReaction.id,
        })
      })
      .catch(async (error) => {
        retrySendReactionToFarcaster(error);
      });

  } else if (reaction.reaction === REACTION_TYPE.REPLY) {

    const castData = {
      "text": reaction.text,
      "signer_uuid": reaction.reactionAuthor.signerUUID,
      "parent": reaction.draft.castHash,
      "idem": reaction.id.slice(0, 16),
    }

    await axios.post(`https://api.neynar.com/v2/farcaster/cast/`, castData, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })
      .then(async (response) => {

        const updatedReaction = await prisma.scheduledReaction.update({
          where: {
            id: reaction.id,
          },
          data: {
            sendStatus: SCHEDULED_REACTION_STATUS.SUCCESS,
          },
        })

        console.log(`Successfully sent reaction ${reaction.text ? reaction.text.slice(0, 24) : reaction.reaction}... from user ${reaction.reactionAuthor.fid}.`);

        trackPosthogEvent(reaction.reactionAuthor.fid, "scheduled_reaction_sent", {
          reactionId: updatedReaction.id,
        })
      }).catch(async (error) => {
        retrySendReactionToFarcaster(error);
      });
  }
}

export async function sendScheduledReactions(draft: Draft) {

  const scheduledReactions = await prisma.scheduledReaction.findMany({
    where: {
      sendStatus: SCHEDULED_REACTION_STATUS.PENDING,
      draftId: draft.id,
    },
    include: {
      reactionAuthor: true,
      draft: true,
    }
  });

  console.log(`Found ${scheduledReactions.length} scheduled reactions to this draft.`)

  const draftPromises = scheduledReactions.map(reaction => sendReactionToFarcaster(reaction, 0));

  await Promise.all(draftPromises);
}

export async function sendDraftToFarcaster(draft: DraftFull): Promise<DraftFull | null> {

  const ANON_MODE_ENABLED = process.env.NEXT_PUBLIC_ANON_MODE_ENABLED === 'true';

  if (ANON_MODE_ENABLED && (draft.isAnon || draft.author.fid === Number(process.env.NEXT_PUBLIC_SUPERANON_FID))) {
    const { isValid, errorMessage } = await isValidAnonPost(draft)

    if (!isValid) {
      throw new Error(errorMessage)
    }
  }

  const idempotencyKey = draft.nextScheduledAt ? draft.id.slice(0, 8) + draft.nextScheduledAt.getTime().toString().slice(0, 8) : draft.id.slice(0, 16)

  const castData = {
    "text": draft.text,
    "signer_uuid": (ANON_MODE_ENABLED && draft.isAnon) ? process.env.SUPERANON_SIGNER_UUID : draft.author.signerUUID,
    "embeds": draft.embeds,
    "idem": idempotencyKey,
    "channel_id": draft.channelId ? draft.channelId : "",
    "parent": draft.parentDraft ? draft.parentDraft.castHash : "",
  }

  let updatedDraft;

  try {
    const response = await axios.post(`https://api.neynar.com/v2/farcaster/cast/`, castData, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

    let nextScheduledAt = draft.nextScheduledAt;

    if (draft.recurring === DRAFT_RECURRING_SCHEDULE.DAILY) {

      nextScheduledAt = new Date(draft.nextScheduledAt.getTime() + 24 * 60 * 60 * 1000);

    } else if (draft.recurring === DRAFT_RECURRING_SCHEDULE.WEEKLY) {

      nextScheduledAt = new Date(draft.nextScheduledAt.getTime() + 7 * 24 * 60 * 60 * 1000);

    } else if (draft.recurring === DRAFT_RECURRING_SCHEDULE.MONTHLY) {

      const now = new Date(draft.nextScheduledAt);
      const currentMonth = now.getMonth();
      const nextMonth = new Date(now.setMonth(currentMonth + 1));

      // If the next month does not have the same date, it will overflow to the next month
      // To fix this, set the date to the last day of the next month if overflowed
      if (nextMonth.getMonth() === currentMonth + 2) {
        nextMonth.setMonth(currentMonth + 1, 0); // setting date to 0 will result in the last day of the previous month
      }

      nextScheduledAt = nextMonth;
    }

    let sendStatus = draft.recurring === DRAFT_RECURRING_SCHEDULE.NONE ? DRAFT_SEND_STATUS.SENT : DRAFT_SEND_STATUS.SCHEDULED;

    updatedDraft = await prisma.draft.update({
      where: {
        id: draft.id,
      },
      data: {
        castHash: response.data.cast.hash,
        sendStatus: sendStatus,
        lastSentAt: new Date(),
        nextScheduledAt: nextScheduledAt,
      },
      include: {
        replyDraft: {
          include: {
            author: true,
            parentDraft: true
          }
        },
        parentDraft: true
      }
    })

    sendScheduledReactions(updatedDraft)

    trackPosthogEvent(draft.author.fid, "cast_sent", {
      "draft_id": draft.id,
      "channel_id": updatedDraft.channelId,
      "hash": response.data.cast.hash,
      "asFid": draft.author.fid,
      "type": draft.isTopLevel ? "top_level" : "thread_reply",
      "is_anon": draft.isAnon,
      "scheduled": draft.sendStatus === DRAFT_SEND_STATUS.SCHEDULED,
    })

    return updatedDraft
  } catch (error) {

    updatedDraft = prisma.draft.update({
      where: {
        id: draft.id,
        authorId: draft.author.id,
      },
      data: {
        sendStatus: DRAFT_SEND_STATUS.ERROR,
      },
      include: {
        replyDraft: true
      }
    })

    trackPosthogEvent(draft.author.fid, "cast_sent_fail", {
      "draft_id": updatedDraft.id,
      "isTopLevel": updatedDraft.isTopLevel,
      "asFid": draft.author.fid,
      "is_anon": draft.isAnon,
      "scheduled": updatedDraft.sendStatus === DRAFT_SEND_STATUS.SCHEDULED,
    })

    if (error.response.data.code === "SignerNotApproved") {
      throw new Error("NO_SIGNER_APPROVED")
    }

    throw error
  }
}
