import { truncateLongWord } from "@/utils/textUtils";
import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { formatNumber } from "@/utils/textUtils";
// App router includes @vercel/og.
// No need to install it.

export const runtime = 'edge';

function fetchFont(url: URL) {
  return fetch(url).then((res) => res.arrayBuffer());
}

const interRegular = fetchFont(
  new URL("../../assets/og/Inter-Regular.ttf", import.meta.url)
);

const interBlack = fetchFont(
  new URL("../../assets/og/Inter-Black.ttf", import.meta.url)
);


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const type = searchParams.get('type');
    // types: landing, profile, cast
    const displayName = searchParams.get('displayName');
    const username = searchParams.get('username');
    const timestamp = searchParams.get('timestamp');
    const avatar = searchParams.get('avatar');
    const reactionCount = Number(searchParams.get('reactionCount') || 0);
    const recastCount = Number(searchParams.get('recastCount') || 0);
    const replyCount = Number(searchParams.get('replyCount') || 0);
    const text = searchParams.get('text');

    const castoraLogo = await fetch(
      new URL("../../../../public/castora-mark.png", import.meta.url)
    ).then((res) => res.arrayBuffer());

    if (type === 'cast') {
      const textLines = truncateLongWord(text, 80)?.split(/\\n|\n/) || [''];

      const avatarImage = await fetch(new URL(avatar, import.meta.url)).then((res) => res.arrayBuffer());

      const farcasterLogo = await fetch(
        new URL("../../../../public/farcaster.png", import.meta.url)
      ).then((res) => res.arrayBuffer());

      return new ImageResponse(
        (
          <div
            style={{
              backgroundColor: "#f5f3ff",
              height: "100%",
              width: "100%",
              display: "flex",
              fontFamily: '"Inter"',
              alignItems: "flex-start",
              justifyContent: "flex-start",
              flexDirection: "column",
              flexWrap: "nowrap",
            }}
          >
            {/* @ts-ignore */}
            {/* <img src={bg} style={{ position: "absolute", width: "100%", height: "100%" }} /> */}
            <div tw="flex flex-col w-full">
              <div tw="flex justify-start items-center text-5xl px-10 h-[140px]">
                {/* @ts-ignore */}
                <img src={avatarImage} tw="w-24 h-24 rounded-full object-cover mr-2 border-4 border-gray-900" />
                <p tw="font-bold mr-4">
                  @{username}
                </p>
                <p tw="text-gray-900">
                  on farcaster
                </p>
                {/* @ts-ignore */}
                <img src={farcasterLogo} tw="w-16 h-16 ml-2" />
              </div>
              <div tw="flex flex-col px-10 w-full h-[380px]">
                <div tw="flex bg-white h-full bg-opacity-90 w-full px-10 py-2 border-4 border-gray-900 rounded-xl shadow-md">
                  <div tw="flex flex-col justify-between h-full">
                    <div tw="flex flex-col">
                      {textLines.map((line, index) => (
                        <p key={index} tw="text-5xl mb-2">
                          {line}
                        </p>
                      ))}
                    </div>
                    <div tw="flex text-4xl">
                      <div tw="flex mr-12">
                        <p tw="mr-2 font-bold">{formatNumber(replyCount)}</p>
                        <p tw="text-gray-900">replies</p>
                      </div>
                      <div tw="flex mr-12">
                        <p tw="mr-2 font-bold">{formatNumber(recastCount)}</p>
                        <p tw="text-gray-900">recasts</p>
                      </div>
                      <div tw="flex">
                        <p tw="mr-2 font-bold">{formatNumber(reactionCount)}</p>
                        <p tw="text-gray-900">likes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div tw="flex justify-center items-center w-full mt-6">
              {/* @ts-ignore */}
              <img src={superlogo} tw="w-12 h-12 mr-2" />
              <p tw="text-black text-4xl font-bold mr-1">Castora.</p>
              <p tw="text-black text-4xl">Build on Farcaster ツ</p>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
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

      const bg = await fetch(
        new URL("../../assets/og/castora-og-bg.jpeg", import.meta.url)
      ).then((res) => res.arrayBuffer());

      return new ImageResponse(
        (
          <div style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
          }}>
            {/* @ts-ignore */}
            <img src={bg} style={{ position: "absolute", width: "100%", height: "100%" }} />
            <div tw="flex flex-col items-center">
              <div tw="flex flex-row items-center pt-[100px]">
                {/* @ts-ignore */}
                <img src={castoraLogo} tw="w-[128px] h-[128px] mr-8" />
                <h1 tw="text-black text-[128px] font-bold">Castora</h1>
              </div>
              <p tw="text-gray-800 text-[72px] pt-[20px]">Build on Farcaster ツ</p>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
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
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
