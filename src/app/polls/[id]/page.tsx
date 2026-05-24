// import { kv } from "@vercel/kv";
// import { PollVoteForm } from "@/app/form";
import { HOST_URL } from "@/utils/hostURL";
import { Metadata, ResolvingMetadata } from "next";
import { Poll } from "@prisma/client";
import { prisma } from "@/prisma/client";


async function getPoll(id: string): Promise<Poll> {

  let defaultPoll: Poll = {
    id: "uuid123",
    createdAt: new Date(),
    updatedAt: new Date(),
    question: "something went wrong",
    username: "",
    answer_1: "default answer 1",
    answer_2: "default answer 2",
    answer_3: "default answer 3",
    answer_4: "default answer 4",
    vote_1_count: 0,
    vote_2_count: 0,
    vote_3_count: 0,
    vote_4_count: 0,
    supercastFarcasterAccountId: "uuid123",
    ownerId: "uuid123",
  };

  try {
    let poll: Poll | null = await prisma.poll.findUnique({
      where: {
        id: id
      }
    });

    if (!poll) {
      return defaultPoll;
    }

    return poll;

  } catch (error) {
    console.error(error);
    return defaultPoll;
  }

}

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const id = params.id
  const poll = await getPoll(id)

  const fcMetadata: Record<string, string> = {
    "fc:frame": "vNext",
    "fc:frame:post_url": `${HOST_URL}/api/polls/vote/${id}`,
    "fc:frame:image": `${HOST_URL}/api/polls/image?username=${encodeURIComponent(poll.username)}&question=${encodeURIComponent(poll.question)}`,
    "fc:frame:image:aspect_ratio": "1.91:1",
  };
  [poll.answer_1, poll.answer_2, poll.answer_3, poll.answer_4].filter(o => o !== "").map((option, index) => {
    fcMetadata[`fc:frame:button:${index + 1}`] = option;
  })


  return {
    title: poll.question,
    openGraph: {
      title: poll.question,
      images: [`/api/polls/image?username=${poll.username}&question=${poll.question}`],
    },
    other: {
      ...fcMetadata,
    },
    metadataBase: new URL(HOST_URL || '')
  }
}


export default async function Page({ params }: { params: { id: string } }) {
  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <p>gm</p>
      </div>
    </>
  );

}