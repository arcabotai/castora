import { prisma } from '@/prisma/client'
import { HOST_URL } from '@/utils/hostURL';
import { EVENT_TYPE } from '@prisma/client'
import axios from 'axios';

import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {

  const voteData = await req.json()

  const votedAnswer = `vote_${voteData.untrustedData.buttonIndex}_count`

  const neynarData = {
    "cast_reaction_context": false,
    "follow_context": false,
    "message_bytes_in_hex": voteData.trustedData.messageBytes
  }

  const validatedDataResponse = await axios.post(`https://api.neynar.com/v2/farcaster/frame/validate/`, neynarData, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })

  if (validatedDataResponse.status !== 200) {
    return Response.json(validatedDataResponse.data, { status: validatedDataResponse.status })
  }

  // check if there is already a vote with the same fid

  const existingVote = await prisma.pollVote.findFirst({
    where: {
      pollId: params.id,
      voterFid: validatedDataResponse.data.action.interactor.fid,
    },
  });

  if (!!existingVote) {

    const poll = await prisma.poll.findUnique({
      where: {
        id: params.id,
      },
    });

    const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Vote Recorded</title>
      <meta property="og:title" content="Vote Recorded">
      <meta property="og:image" content="${HOST_URL}/api/polls/image?type=results&question=${encodeURIComponent(poll.question)}&answer1=${encodeURIComponent(poll.answer_1)}&answer2=${encodeURIComponent(poll.answer_2)}&answer3=${encodeURIComponent(poll.answer_3)}&answer4=${encodeURIComponent(poll.answer_4)}&vote_1_count=${poll.vote_1_count}&vote_2_count=${poll.vote_2_count}&vote_3_count=${poll.vote_3_count}&vote_4_count=${poll.vote_4_count}&already_voted=${true}">
      <meta name="fc:frame" content="vNext">
      <meta name="fc:frame:image" content="${HOST_URL}/api/polls/image?type=results&question=${encodeURIComponent(poll.question)}&answer1=${encodeURIComponent(poll.answer_1)}&answer2=${encodeURIComponent(poll.answer_2)}&answer3=${encodeURIComponent(poll.answer_3)}&answer4=${encodeURIComponent(poll.answer_4)}&vote_1_count=${poll.vote_1_count}&vote_2_count=${poll.vote_2_count}&vote_3_count=${poll.vote_3_count}&vote_4_count=${poll.vote_4_count}&already_voted=${true}">
      <meta name="fc:frame:post_url" content="${HOST_URL}/api/polls/redirect">
      <meta name="fc:frame:image:aspect_ratio" content="1.91:1">
      <meta name="fc:frame:button:1:action" content="post_redirect">
      <meta name="fc:frame:button:1" content="Create your own poll on Castora">
    </head>
  </html>
  `;

    const response = new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

    return response;

  }

  const updateData = {
    [votedAnswer]: {
      increment: 1,
    },
  }

  const updatedPoll = await prisma.poll.update({
    where: {
      id: params.id,
    },
    data: updateData,
  });

  const vote = await prisma.pollVote.create({
    data: {
      pollId: updatedPoll.id,
      voterFid: validatedDataResponse.data.action.interactor.fid,
      answer: voteData.untrustedData.buttonIndex,
    },
  })

  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Vote Recorded</title>
      <meta property="og:title" content="Vote Recorded">
      <meta property="og:image" content="${HOST_URL}/api/polls/image?type=results&question=${updatedPoll.question}&answer1=${updatedPoll.answer_1}&answer2=${updatedPoll.answer_2}&answer3=${updatedPoll.answer_3}&answer4=${updatedPoll.answer_4}&vote_1_count=${updatedPoll.vote_1_count}&vote_2_count=${updatedPoll.vote_2_count}&vote_3_count=${updatedPoll.vote_3_count}&vote_4_count=${updatedPoll.vote_4_count}&already_voted=${false}">
      <meta name="fc:frame" content="vNext">
      <meta name="fc:frame:image" content="${HOST_URL}/api/polls/image?type=results&question=${updatedPoll.question}&answer1=${updatedPoll.answer_1}&answer2=${updatedPoll.answer_2}&answer3=${updatedPoll.answer_3}&answer4=${updatedPoll.answer_4}&vote_1_count=${updatedPoll.vote_1_count}&vote_2_count=${updatedPoll.vote_2_count}&vote_3_count=${updatedPoll.vote_3_count}&vote_4_count=${updatedPoll.vote_4_count}&already_voted=${false}">
      <meta name="fc:frame:post_url" content="${HOST_URL}/api/polls/redirect">
      <meta name="fc:frame:image:aspect_ratio" content="1.91:1">
      <meta name="fc:frame:button:1:action" content="post_redirect">
      <meta name="fc:frame:button:1" content="Create your own poll on Castora">
    </head>
  </html>
  `;

  const response = new NextResponse(htmlContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  });

  return response;
}