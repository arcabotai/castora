import { Post, ProfileInfo, UserPersonality } from "./types";
import axios from "axios";
import { neynar } from '@/lib/neynar'
import OpenAI from "openai";

import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const fetchRecentCastsByFid = async (fid: number, limit: number): Promise<Post[]> => {
  console.log("Fetching recent casts for fid", fid);
  const startTime = performance.now();
  const allPosts: Post[] = [];
  let cursor = undefined;

  while (allPosts.length < limit) {
    const response = await neynar.get(`/v2/farcaster/feed/`, {
      params: {
        feed_type: "filter",
        filter_type: "fids",
        fids: fid,
        limit: 100,
        cursor: cursor,
        with_recasts: false,
      },
      headers: {
        accept: "application/json",
        },
    });

    const posts = response.data.casts
      .filter((cast: { text: string }) => cast.text.length > 0)
      .map((cast: { text: string, reactions: { likes_count: number, recasts_count: number }, replies: { count: number }, channel: { id: string } }) => (
        {
          text: cast.text,
          likes_count: cast.reactions.likes_count,
          reposts_count: cast.reactions.recasts_count,
          comments_count: cast.replies.count,
          channel_id: cast.channel?.id,
        }
      ));
    if (!posts || posts.length === 0) break;

    allPosts.push(...posts);
    cursor = response.data.next?.cursor;
    if (!cursor) break;
  }

  const endTime = performance.now();
  console.log(`Fetched ${allPosts.length} casts in ${((endTime - startTime) / 1000).toFixed(2)}s`);
  return allPosts.slice(0, limit);
}

const fetchPopularCastsByFid = async (fid: number, limit: number): Promise<Post[]> => {
  console.log("Fetching popular casts for fid", fid);
  const startTime = performance.now();
  const allPosts: Post[] = [];
  let cursor = undefined;

  while (allPosts.length < limit) {
    const response = await neynar.get(`/v2/farcaster/feed/user/popular/`, {
      params: {
        fid: fid,
        limit: 10,
        cursor: cursor,
      },
      headers: {
        accept: "application/json",
        },
    });

    const posts = response.data.casts
      .filter((cast: { text: string }) => cast.text.length > 0)
      .map((cast: { text: string, reactions: { likes_count: number, recasts_count: number }, replies: { count: number }, channel: { id: string } }) => (
        {
          text: cast.text,
          likes_count: cast.reactions.likes_count,
          reposts_count: cast.reactions.recasts_count,
          comments_count: cast.replies.count,
          channel_id: cast.channel?.id,
        }
      ));
    if (!posts || posts.length === 0) break;

    allPosts.push(...posts);
    cursor = response.data.next?.cursor;
    if (!cursor) break;
  }

  const endTime = performance.now();
  console.log(`Fetched ${allPosts.length} casts in ${((endTime - startTime) / 1000).toFixed(2)}s`);
  return allPosts.slice(0, limit);
}

export const fetchProfileInfoByFid = async (userFid: number) => {

  const startTime = performance.now();

  const userProfileResponse = await neynar.get("/v2/farcaster/user/bulk/",
    {
      params: { fids: userFid },
      headers: {
        accept: "application/json",
        },
    },
  );

  const profileInfo: ProfileInfo = {
    display_name: userProfileResponse.data.users[0].display_name,
    username: userProfileResponse.data.users[0].username,
    pfp_url: userProfileResponse.data.users[0].pfp_url,
    bio: userProfileResponse.data.users[0].profile.bio.text,
    follower_count: userProfileResponse.data.users[0].follower_count,
    following_count: userProfileResponse.data.users[0].following_count,
  }

  const endTime = performance.now();
  console.log(`Fetched profile info in ${((endTime - startTime) / 1000).toFixed(2)}s`);

  return profileInfo;
}

const analyzePersonality = async (
  recentPosts: Post[],
  popularPosts: Post[],
  profileInfo: ProfileInfo
): Promise<UserPersonality> => {
  const systemPrompt = `You are a skilled social media analyst and psychologist. Your task is to analyze user behavior patterns, content preferences, and interaction styles to create detailed personality profiles. You will be provided with both recent posts and their most popular posts to understand their typical behavior vs. their most successful content.

Follow these guidelines:
1. Compare recent vs. popular posts to identify:
   - What topics/styles resonate most with their audience
   - How their content style has evolved
   - Consistent patterns vs. outlier successes

2. Analyze patterns in:
   - Writing style, tone, and word choice
   - Engagement patterns (likes, comments, reposts)
   - Content themes and interests
   - Posting frequency and timing
   - Response to comments and community interaction

3. Consider profile metadata:
   - Self-presentation in bio
   - Following/follower ratio
   - Profile picture choice
   - Username style

Base all conclusions on concrete evidence from the data. Be specific but avoid unfounded assumptions.

IMPORTANT: Your response must be in valid JSON format with double quotes around all property names and string values.`;

  const analysisPrompt = `Please analyze the following social media user data and generate a detailed personality profile.

Input Data:
Profile Information: ${JSON.stringify(profileInfo, null, 2)}

Recent Posts (showing regular behavior): 
${JSON.stringify(recentPosts, null, 2)}

Popular Posts (showing most successful content): 
${JSON.stringify(popularPosts, null, 2)}

Based on this data, create a personality profile that includes:

1. A concise 2-3 sentence description of their overall personality and life. Be very specific about their life and history.
2. 5-7 main one word interests derived from their content and interactions
3. 3-5 dominant personality specific, one word traits supported by their behavior patterns
4. Primary channels ids they engage in
5. 3-5 interesting and very specific facts about their behavior, like:
   - Unique behavioral quirks
   - Something unusal about their life
   - The coolest thing they created
6. Key usernames they interact with in a positive way
7. Likely occupational areas and companies they work for based on their content and expertise
8. Don't assume gender, unless it's very obvious
9. Important: Crypto or Farcaster are not valid interests.

Always use precise names and details.

Return your response in this exact JSON format:
{
  "description": "string value with overall persona description. don't mention gender. use some specific details about the owner's life.",
  "interests": ["interest1", "interest2", "interest3"],
  "traits": ["trait1", "trait2", "trait3"],
  "channels": ["channel1", "channel2"],
  "randomFacts": ["fact1", "fact2", "fact3"],
  "friend_usernames": ["username1", "username2"],
  "occupations": ["occupation1", "occupation2"]
}

IMPORTANT: Ensure all property names and string values are enclosed in double quotes to maintain valid JSON format.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Try to parse the response content
    let result: UserPersonality;
    try {
      result = JSON.parse(response.choices[0].message.content || "") as UserPersonality;
    } catch (parseError) {
      console.error("Failed to parse GPT response:", response.choices[0].message.content);
      throw new Error("Invalid JSON response from GPT");
    }

    // Validate the response structure
    const requiredFields: (keyof UserPersonality)[] = [
      'description',
      'interests',
      'traits',
      'channels',
      'randomFacts',
      'friend_usernames',
      'occupations'
    ];

    for (const field of requiredFields) {
      if (!result[field]) {
        throw new Error(`Invalid response: missing ${field}`);
      }
    }

    return result;
  } catch (error) {
    console.error("Error analyzing user personality:", error);
    throw error;
  }
};

export async function getUserPersonality(fid: number): Promise<UserPersonality> {

  const recentOwnerPosts = await fetchRecentCastsByFid(fid, 500);
  const popularOwnerPosts = await fetchPopularCastsByFid(fid, 50);
  const profileInfo = await fetchProfileInfoByFid(fid);

  const personality = await analyzePersonality(recentOwnerPosts, popularOwnerPosts, profileInfo);

  return personality;
}
