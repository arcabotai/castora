import { prisma } from "@/prisma/client";
import { HeartIcon } from "@heroicons/react/24/outline";
import { ImageResponse } from "@vercel/og";
import { publicCacheHeaders } from "@/utils/cacheHeaders";
// App router includes @vercel/og.
// No need to install it.

export const runtime = 'edge';

function fetchFont(url: URL) {
  return fetch(url).then((res) => res.arrayBuffer());
}

const interRegular = fetchFont(
  new URL("../../../assets/og/Inter-Regular.ttf", import.meta.url)
);

const interBlack = fetchFont(
  new URL("../../../assets/og/Inter-Black.ttf", import.meta.url)
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type');
    const username = searchParams.get('username');
    const question = searchParams.get('question');

    const answer1 = searchParams.get('answer1');
    const answer2 = searchParams.get('answer2');
    const answer3 = searchParams.get('answer3');
    const answer4 = searchParams.get('answer4');
    const vote_1_count = searchParams.get('vote_1_count');
    const vote_2_count = searchParams.get('vote_2_count');
    const vote_3_count = searchParams.get('vote_3_count');
    const vote_4_count = searchParams.get('vote_4_count');
    const already_voted = searchParams.get('already_voted');

    const total = parseInt(vote_1_count) + parseInt(vote_2_count) + parseInt(vote_3_count) + parseInt(vote_4_count);

    const vote_1_percent = Math.round((parseInt(vote_1_count) / total) * 100);
    const vote_2_percent = Math.round((parseInt(vote_2_count) / total) * 100);
    const vote_3_percent = Math.round((parseInt(vote_3_count) / total) * 100);
    const vote_4_percent = Math.round((parseInt(vote_4_count) / total) * 100);


    if (type === "results") {
      return new ImageResponse(
        (
          <div tw="flex flex-col w-full h-full justify-between bg-white pl-20 pt-6 pb-20 font-black">
            <div tw="flex flex-col">
              <div tw="flex text-6xl mb-2 text-gray-400">{question}</div>
              <div tw="flex flex-row">
                <p tw="text-4xl mr-6">{answer1}</p>
                <p tw="text-4xl mr-6">—</p>
                <p tw="text-4xl mr-3">{vote_1_count} votes</p>
                <p tw="text-4xl text-gray-400">({vote_1_percent}%)</p>
              </div>
              <div tw={`w-[${vote_1_percent * 10}px] h-12 bg-black mb-1 -mt-4 rounded-lg`}></div>
              {!!answer2 && (
                <div tw="flex flex-row">
                  <p tw="text-4xl mr-6">{answer2}</p>
                  <p tw="text-4xl mr-6">—</p>
                  <p tw="text-4xl mr-3">{vote_2_count} votes</p>
                  <p tw="text-4xl text-gray-400">({vote_2_percent}%)</p>
                </div>
              )}
              <div tw={`w-[${vote_2_percent * 10}px] h-12 bg-black mb-1 -mt-4 rounded-lg`}></div>
              {!!answer3 && (
                <div tw="flex flex-row">
                  <p tw="text-4xl mr-6">{answer3}</p>
                  <p tw="text-4xl mr-6">—</p>
                  <p tw="text-4xl mr-3">{vote_3_count} votes</p>
                  <p tw="text-4xl text-gray-400">({vote_3_percent}%)</p>
                </div>
              )}
              <div tw={`w-[${vote_3_percent * 10}px] h-12 bg-black mb-1 -mt-4 rounded-lg`}></div>
              {!!answer4 && (
                <div tw="flex flex-row">
                  <p tw="text-4xl mr-6">{answer4}</p>
                  <p tw="text-4xl mr-6">—</p>
                  <p tw="text-4xl mr-3">{vote_4_count} votes</p>
                  <p tw="text-4xl text-gray-400">({vote_4_percent}%)</p>
                </div>
              )}
              <div tw={`w-[${vote_4_percent * 10}px] h-12 bg-black mb-1 -mt-4 rounded-lg`}></div>
            </div>
            <div tw="flex flex-row text-5xl justify-end pr-20 text-gray-400">
              {already_voted === "true" && <p>You already voted.</p>}
              {already_voted === "false" && <p>Thank you for your vote!</p>}
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
          headers: publicCacheHeaders({ browserMaxAge: 300, cdnMaxAge: 3600, staleWhileRevalidate: 86400 }),
          fonts: [
            {
              name: "Inter",
              data: await interRegular,
              weight: 400,
              style: "normal",
            },
            {
              name: "Inter",
              data: await interBlack,
              weight: 900,
              style: "normal",
            },
          ],
        },
      );
    } else {
      return new ImageResponse(
        (
          <div tw="flex flex-col w-full h-full justify-between bg-white pl-20 pt-40 pb-20 font-black">
            <div tw="flex flex-col">
              <div tw="flex text-5xl mb-6 text-gray-400">@{username} is asking:</div>
              <div tw="text-7xl">{question}</div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
          headers: publicCacheHeaders({ browserMaxAge: 300, cdnMaxAge: 3600, staleWhileRevalidate: 86400 }),
          fonts: [
            {
              name: "Inter",
              data: await interRegular,
              weight: 400,
              style: "normal",
            },
            {
              name: "Inter",
              data: await interBlack,
              weight: 900,
              style: "normal",
            },
          ],
        },
      );
    }
  }
  catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to fetch the poll`, {
      status: 500,
    });
  }
}
