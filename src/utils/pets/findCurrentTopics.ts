import { UserPersonality, CurrentTopic, Post } from "./types";
import { fetchRecentCastsByFid } from "./personalityTest";
import axios from "axios";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

import dotenv from 'dotenv';
dotenv.config();

type PostWithReactionStatus = Post & {
  likedByOwner: boolean;
  repostedByOwner: boolean;
}

export const fetchRecentPostsFromFavoriteChannels = async (ownerFid: number, userPersonality: UserPersonality, limit: number): Promise<PostWithReactionStatus[]> => {
  console.log(`Fetching recent posts from favorite channels ${userPersonality.channels}`);
  const startTime = performance.now();
  const allPosts: PostWithReactionStatus[] = [];
  let cursor = undefined;

  while (allPosts.length < limit) {
    const response = await axios.get(`https://api.neynar.com/v2/farcaster/feed/channels`, {
      params: {
        channel_ids: userPersonality.channels.join(","),
        viewer_fid: ownerFid,
        with_recasts: false,
        with_replies: false,
        members_only: true,
        limit: 100,
        cursor: cursor,
      },
      headers: {
        accept: "application/json",
        api_key: process.env.NEYNAR_API_KEY,
      },
    });

    const posts = response.data.casts
      .filter((cast: { text: string, timestamp: string }) => cast.text.length > 0 && new Date(cast.timestamp) > new Date(Date.now() - 1000 * 60 * 60 * 24)) // only get posts from the last 24 hours
      .map((cast: { text: string, reactions: { likes_count: number, recasts_count: number }, replies: { count: number }, channel: { id: string }, viewer_context: { liked: boolean, recasted: boolean } }) => ({
        text: cast.text,
        likes_count: cast.reactions.likes_count,
        reposts_count: cast.reactions.recasts_count,
        comments_count: cast.replies.count,
        channel_id: cast.channel?.id,
        likedByOwner: cast.viewer_context.liked,
        repostedByOwner: cast.viewer_context.recasted,
      }));

    if (!posts || posts.length === 0) break;

    allPosts.push(...posts);
    cursor = response.data.next?.cursor;
    if (!cursor) break;
  }

  // sort by likes_count + reposts_count
  allPosts.sort((a, b) => (b.likes_count + b.reposts_count) - (a.likes_count + a.reposts_count));

  const endTime = performance.now();
  console.log(`Time taken to fetch recent posts from favorite channels: ${((endTime - startTime) / 1000).toFixed(2)}s`);
  return allPosts;
}

export const fetchForYouFeed = async (ownerFid: number, limit: number): Promise<PostWithReactionStatus[]> => {
  console.log(`Fetching For You feed for fid ${ownerFid}`);
  const startTime = performance.now();
  const allPosts: PostWithReactionStatus[] = [];
  let cursor = undefined;

  while (allPosts.length < limit) {
    const response = await axios.get(`https://api.neynar.com/v2/farcaster/feed/for_you`, {
      params: {
        fid: ownerFid,
        viewer_fid: ownerFid,
        provider: 'openrank',
        limit: 50,
        cursor: cursor,
      },
      headers: {
        accept: "application/json",
        api_key: process.env.NEYNAR_API_KEY,
      },
    });

    const posts = response.data.casts
      .filter((cast: { text: string, timestamp: string }) =>
        cast.text.length > 0 && new Date(cast.timestamp) > new Date(Date.now() - 1000 * 60 * 60 * 24))
      .map((cast: { text: string, reactions: { likes_count: number, recasts_count: number }, replies: { count: number }, channel: { id: string }, viewer_context: { liked: boolean, recasted: boolean } }) => ({
        text: cast.text,
        likes_count: cast.reactions.likes_count,
        reposts_count: cast.reactions.recasts_count,
        comments_count: cast.replies.count,
        channel_id: cast.channel?.id,
        likedByOwner: cast.viewer_context.liked,
        repostedByOwner: cast.viewer_context.recasted,
      }));

    if (!posts || posts.length === 0) break;

    allPosts.push(...posts);
    cursor = response.data.next?.cursor;
    if (!cursor) break;
  }

  const endTime = performance.now();
  console.log(`Time taken to fetch For You feed: ${((endTime - startTime) / 1000).toFixed(2)}s`);
  return allPosts;
}

export const fetchTrendingFeed = async (ownerFid: number, limit: number): Promise<PostWithReactionStatus[]> => {
  console.log(`Fetching Trending feed for fid ${ownerFid}`);
  const startTime = performance.now();
  const allPosts: PostWithReactionStatus[] = [];
  let cursor = undefined;

  while (allPosts.length < limit) {
    const response = await axios.get(`https://api.neynar.com/v2/farcaster/feed`, {
      params: {
        feed_type: 'filter',
        filter_type: 'global_trending',
        viewer_fid: ownerFid,
        limit: 100,
        cursor: cursor,
      },
      headers: {
        accept: "application/json",
        api_key: process.env.NEYNAR_API_KEY,
      },
    });

    const posts = response.data.casts
      .filter((cast: { text: string, timestamp: string }) =>
        cast.text.length > 0 && new Date(cast.timestamp) > new Date(Date.now() - 1000 * 60 * 60 * 24))
      .map((cast: { text: string, reactions: { likes_count: number, recasts_count: number }, replies: { count: number }, channel: { id: string }, viewer_context: { liked: boolean, recasted: boolean } }) => ({
        text: cast.text,
        likes_count: cast.reactions.likes_count,
        reposts_count: cast.reactions.recasts_count,
        comments_count: cast.replies.count,
        channel_id: cast.channel?.id,
        likedByOwner: cast.viewer_context.liked,
        repostedByOwner: cast.viewer_context.recasted,
      }));

    if (!posts || posts.length === 0) break;

    allPosts.push(...posts);
    cursor = response.data.next?.cursor;
    if (!cursor) break;
  }

  const endTime = performance.now();
  console.log(`Time taken to fetch Trending feed: ${((endTime - startTime) / 1000).toFixed(2)}s`);
  return allPosts;
}

export async function findTopicsFromPosts(
  ownerPosts: PostWithReactionStatus[],
  channelPosts: PostWithReactionStatus[],
  forYouPosts: PostWithReactionStatus[],
  trendingPosts: PostWithReactionStatus[],
  userPersonality: UserPersonality
): Promise<CurrentTopic[]> {
  const systemPrompt = `You are an expert social media analyst specializing in identifying trending topics and themes. Your task is to analyze posts and user personality data to find the most relevant and interesting topics for this specific user.

Consider these aspects of the user's profile:
1. Known interests: ${userPersonality.interests.join(', ')}
2. Personality traits: ${userPersonality.traits.join(', ')}
3. Preferred channels: ${userPersonality.channels.join(', ')}
4. Professional background: ${userPersonality.occupations.join(', ')}
5. Notable facts: ${userPersonality.randomFacts.join(', ')}

Follow these guidelines:
1. Prioritize topics that align with the user's documented interests
2. Look for discussions that match their personality traits
3. Pay special attention to their preferred channels
4. Consider their professional context
5. Focus on topics where the user's expertise could add value
6. Look for emerging discussions in their areas of interest

Don't consider topics related to:
- Crypto
- AI
- Farcaster

Prioritize topics that are:
- Timely
- Related to hobbies and interests
- Related to locations
- Related to real life experiences
`;

  const analysisPrompt = `Analyze these social media posts and identify the 5 most interesting topics for this specific user.

User Profile Summary:
${JSON.stringify(userPersonality, null, 2)}

Owner's Recent Posts:
${JSON.stringify(ownerPosts, null, 2)}

Recent Posts from their favorite communities:
${JSON.stringify(channelPosts, null, 2)}

Posts from their friends:
${JSON.stringify(forYouPosts, null, 2)}

Posts trending on the whole platform:
${JSON.stringify(trendingPosts, null, 2)}

For each topic, provide:
1. The main topic/theme being discussed
2. Context explaining:
   - How it relates to the user's interests and traits
   - How it appears in their content
   - How it manifests in channel discussions
   - Why it's particularly relevant for them
3. Key author/contributor driving the discussion
4. Related keywords and phrases that connect to user's interests

Topics should be especially relevant considering:
- User's documented interests: ${userPersonality.interests.join(', ')}
- Their personality traits: ${userPersonality.traits.join(', ')}
- Their professional background: ${userPersonality.occupations.join(', ')}
- Their preferred channels: ${userPersonality.channels.join(', ')}
- Their social connections: ${userPersonality.friend_usernames.join(', ')}

Return exactly 5 topics in valid JSON format, sorted by relevance to the user's profile.
Each topic should demonstrate clear connection to user's interests or expertise.
The topics should be simple and easy to understand.
Use simple language.
Find topics that are very timely and unlikely to be repeated.
Make sure that the topics are light and easy to follow, but specific to the user individual interests.
Make sure that topics are differentiated and not just variations of each other.

Return format:
{
  "topics": [
    {
      "topic": "Main topic or theme",
      "context": "Why this is significant for this specific user, connecting their interests and traits to the discussion",
      "author": "Key contributor's username (could be owner or community member)",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
    // ... 4 more topics
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error("Empty response from GPT");
    }

    let result;
    try {
      result = JSON.parse(content.trim());
    } catch (parseError) {
      console.error("Parse error details:", parseError);
      console.error("Problematic content:", content);
      throw new Error(`Invalid JSON response from GPT: ${parseError.message}`);
    }

    // Validate and transform the response
    if (!result.topics || !Array.isArray(result.topics) || result.topics.length !== 5) {
      throw new Error("Invalid response format: expected exactly 5 topics");
    }

    const currentTopics: CurrentTopic[] = result.topics.map((topic: any, index: number) => {
      // Validate each topic
      if (!topic.topic || !topic.context || !topic.author ||
        !Array.isArray(topic.keywords)) {
        throw new Error("Invalid topic format");
      }

      // Ensure we have at least 2 keywords
      if (topic.keywords.length < 2) {
        throw new Error("Each topic must have at least 2 keywords");
      }

      // Add user relevance to the context if not explicitly mentioned
      if (!topic.context.includes(userPersonality.interests[0])) {
        topic.context = `${topic.context} This topic aligns with the user's interests in ${userPersonality.interests.slice(0, 2).join(' and ')}.`;
      }

      return {
        topic: topic.topic,
        context: topic.context,
        author: topic.author,
        keywords: topic.keywords
      };
    });

    return currentTopics;

  } catch (error) {
    console.error("Error finding topics:", error);
    if (error instanceof Error) {
      throw new Error(`Topic analysis failed: ${error.message}`);
    }
    throw error;
  }
}

// Updated findCurrentTopics function
export async function findCurrentTopics(
  ownerFid: number,
  userPersonality: UserPersonality
): Promise<CurrentTopic[]> {
  // Fetch all types of posts
  const [ownerPosts, channelPosts, forYouPosts, trendingPosts] = await Promise.all([
    fetchRecentCastsByFid(ownerFid, 10) as Promise<PostWithReactionStatus[]>,
    fetchRecentPostsFromFavoriteChannels(ownerFid, userPersonality, 100),
    fetchForYouFeed(ownerFid, 100),
    fetchTrendingFeed(ownerFid, 100)
  ]);

  // Preprocess all post types
  const preprocessedOwnerPosts = preprocessPostsWithPersonality(ownerPosts, userPersonality);
  const preprocessedChannelPosts = preprocessPostsWithPersonality(channelPosts, userPersonality);
  const preprocessedForYouPosts = preprocessPostsWithPersonality(forYouPosts, userPersonality);
  const preprocessedTrendingPosts = preprocessPostsWithPersonality(trendingPosts, userPersonality);

  console.log("preprocessedOwnerPosts", preprocessedOwnerPosts.length);
  console.log("preprocessedChannelPosts", preprocessedChannelPosts.length);
  console.log("preprocessedForYouPosts", preprocessedForYouPosts.length);
  console.log("preprocessedTrendingPosts", preprocessedTrendingPosts.length);


  // Find topics considering all sources
  const relevantTopics = await findTopicsFromPosts(
    preprocessedOwnerPosts,
    preprocessedChannelPosts,
    preprocessedForYouPosts,
    preprocessedTrendingPosts,
    userPersonality
  );

  console.log("relevantTopics", relevantTopics);

  return relevantTopics;
}

// Enhanced preprocessing function that considers user personality
function preprocessPostsWithPersonality(
  posts: PostWithReactionStatus[],
  userPersonality: UserPersonality
) {
  return posts.map(post => {
    const baseScore = calculateEngagementScore(post);
    const personalityScore = calculatePersonalityRelevance(post, userPersonality);

    return {
      ...post,
      engagementScore: baseScore + personalityScore
    };
  }).sort((a, b) => b.engagementScore - a.engagementScore);
}

// Calculate how relevant a post is to user's interests and traits
function calculatePersonalityRelevance(
  post: PostWithReactionStatus,
  userPersonality: UserPersonality
): number {
  let score = 0;

  // Check for mentions of user's interests
  userPersonality.interests.forEach(interest => {
    if (post.text.toLowerCase().includes(interest.toLowerCase())) {
      score += 3;
    }
  });

  // Check for mentions of user's professional topics
  userPersonality.occupations.forEach(occupation => {
    if (post.text.toLowerCase().includes(occupation.toLowerCase())) {
      score += 2;
    }
  });

  // Check if post is from a preferred channel
  if (userPersonality.channels.includes(post.channel_id || '')) {
    score += 2;
  }

  // Check for mentions of user's connections
  userPersonality.friend_usernames.forEach(username => {
    if (post.text.toLowerCase().includes(username.toLowerCase())) {
      score += 1;
    }
  });

  return score;
}

// Original engagement score calculation (unchanged)
function calculateEngagementScore(post: PostWithReactionStatus): number {
  let score = 0;
  score += post.likes_count * 1;
  score += post.reposts_count * 2;
  score += post.comments_count * 3;
  if (post.likedByOwner) score += 5;
  if (post.repostedByOwner) score += 10;
  return score;
}