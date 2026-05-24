import axios from 'axios';
import { prisma } from '../../prisma/client'
import Redis from 'ioredis'

const CACHE_TTL = 24 * 60 * 60 // 24 hours in seconds
const redis = new Redis(process.env.REDIS_URL!)

type LeaderboardEntry = {
  fid: number
  score: number
  username: string
  avatar: string
}

export const calculateLeaderboard = async (days: number | "lifetime"): Promise<LeaderboardEntry[]> => {

  // if days is not provided, caluclate the lifetime leaderboard
  // if days is provided, calculate the leaderboard for the last x days

  const cacheKey = `leaderboard:superanon:${days}`

  const startDate = days === "lifetime" ? new Date(0) : new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const scores = await prisma.superanonScore.findMany({
    where: {
      date: {
        gte: startDate,
      },
    },
    select: {
      score: true,
      draft: {
        select: {
          creator: {
            select: {
              fid: true,
              superanonLeaderboardOptIn: true,
            },
          },
        },
      },
    },
  });

  if (scores.length === 0) {
    return []
  }

  // summarize the scores by fid
  const summarizedScores = scores.reduce((acc, score) => {
    if (score.draft.creator.superanonLeaderboardOptIn) {
      acc[score.draft.creator.fid] = (acc[score.draft.creator.fid] || 0) + score.score;
    }
    return acc;
  }, {});

  // add a penalty 10x for fid 680
  if (summarizedScores[680]) {
    summarizedScores[680] = summarizedScores[680] / 10;
  }

  const leaderboard = Object.entries(summarizedScores).map(([fid, score]) => ({
    fid: parseInt(fid),
    score: Number(score) * 1000,
  }));

  leaderboard.sort((a, b) => b.score - a.score);

  const allFids = leaderboard.map(user => user.fid).join(",");

  const response = await axios.get(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${allFids}`, {
    "headers": { "api_key": process.env.NEYNAR_API_KEY }
  })

  if (response.status !== 200) {
    throw new Error("Failed to fetch user data");
  }

  const hydratedLeaderboard = leaderboard.map(user => ({
    fid: user.fid,
    score: user.score,
    username: response.data.users.find(u => u.fid === user.fid)?.username,
    avatar: response.data.users.find(u => u.fid === user.fid)?.pfp_url,
  }));

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(hydratedLeaderboard))

  return hydratedLeaderboard;
};