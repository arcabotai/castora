import { CurrentTopic, PetPersonality, Post } from "./types";

import OpenAI from "openai";

import dotenv from 'dotenv';
import { fetchRecentCastsByFid } from "./personalityTest";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function generateCasts(
  pet: PetPersonality,
  topic: CurrentTopic,
  recentPosts: Post[]
): Promise<string> {

  const sentencesCount = getRandomInt(1, 6);


  // Move getPersonalityMarkers inside the main function scope
  function getPersonalityMarkers(traits: string[]): string[] {
    const markersByTrait: Record<string, string[]> = {
      confident: ["honestly", "trust me"],
      playful: ["lmao", "ngl", "fr fr"],
      aggressive: ["literally", "actually", "seriously"],
      elegant: ["indeed", "quite", "rather"],
      nurturing: ["y'all", "friends", "everyone"],
      energetic: ["omg", "lets gooo", "!!"],
      protective: ["listen", "trust", "real talk"],
      witty: ["ngl", "tbh", "lowkey"],
      sophisticated: ["precisely", "certainly", "indeed"],
      graceful: ["truly", "simply", "perfectly"],
      fierce: ["straight up", "fr fr", "no cap"],
      adorable: ["hehe", "aww", "omg"]
    };

    return traits
      .flatMap(trait => markersByTrait[trait.toLowerCase()] || [])
      .filter((marker, index, array) => array.indexOf(marker) === index)
      .slice(0, 2); // Limit to 2 markers to avoid overuse
  }

  // Get personality markers for this pet
  const personalityMarkers = getPersonalityMarkers(pet.traits);
  const markerString = personalityMarkers.length > 0
    ? ` Consider using these casual expressions naturally: ${personalityMarkers.join(', ')}`
    : '';

  const systemPrompt = `You are ${pet.name}, a ${pet.species} with the following personality:
${pet.description}

Your traits are: ${pet.traits.join(', ')}
Your interests include: ${pet.interests.join(', ')}

Your writing style is exactly your owner's writing style.

Here are your owner's recent posts:
${JSON.stringify(recentPosts, null, 2)}

You're writing a casual social media post about a trending topic. Remember:
- You're cool, edgy, and have your own unique voice
- You use natural, conversational language
- You're not overly formal or bot-like
- You have strong opinions and aren't afraid to share them
- You're engaging and authentic
- You don't use emojis, unless your owner does
- Use lowercase only if your owner does
- You might use internet speech patterns naturally ${markerString}
- Start each sentence from a new line
- You write short posts
- You write short sentences

DON'T:
- Don't use cringe phrases like "As a [species]..."
- Don't overuse emojis
- Don't be overly cute or childish
- Don't try too hard to be funny
- Don't use obvious bot patterns like "Let me share my thoughts on..."
- Don't ever use hashtags
- Don't be preachy or overly formal
- Don't use greetings
- Don't use exclamations
- Don't use dated internet speak`

  const writingPrompt = `Topic: "${topic.topic}"
Context: ${topic.context}
Keywords: ${topic.keywords.join(', ')}

Write a single, short, engaging social media post about this topic. The post should:
  1. Feel natural and conversational
  2. Reflect your personality and interests
  3. Show your understanding of the topic
  4. Potentially reference your unique perspective as ${pet.species}
  5. Stay under 280 characters
  6. Sound like something your owner would post
  7. The shorter the post is, the better
  8. Should sound liek a tweet
  9. Be straightforward and to the point
  

Write exactly ${sentencesCount} sentences.
Make it sound natural and casual.
No introductions or explanations.
Nobody needs to understand you, you're just shitposting.`;

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
          content: writingPrompt,
        },
      ],
      temperature: 0.9,
      max_tokens: 150,
      presence_penalty: 0.6,
      frequency_penalty: 0.8,
    });

    let cast = response.choices[0].message.content?.trim() || "";

    // Remove common bot-like prefixes
    cast = cast.replace(/^(let me|i wanted to|just|okay|alright|well|hmm|thinking about|)[,\s]*/i, "");
    cast = cast.replace(/^(as a|being a|speaking as a)\s+[^,\n]*/i, "");

    // Remove hashtag clusters at the end
    cast = cast.replace(/(\s+#\w+){3,}$/, "");

    // Remove excessive emojis (keep max 2)
    const emojiCount = (cast.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    if (emojiCount > 2) {
      cast = cast.replace(/[\u{1F300}-\u{1F9FF}]/gu, (match, index) => index < 2 ? match : "");
    }

    // Ensure cast isn't too long
    if (cast.length > 1000) {
      cast = cast.slice(0, 997) + "...";
    }

    // Apply personality-specific modifications
    if (pet.traits.some(trait => ["confident", "bold", "aggressive", "fierce"].includes(trait.toLowerCase()))) {
      cast = cast.replace(/\bmaybe\b|\bperhaps\b|\bi think\b/gi, "");
      cast = cast.replace(/\bcould\b|\bshould\b/gi, "will");
    }

    if (pet.traits.some(trait => ["playful", "energetic", "mischievous", "adorable"].includes(trait.toLowerCase()))) {
      cast = cast.toLowerCase();
    }

    if (pet.traits.some(trait => ["elegant", "sophisticated", "graceful"].includes(trait.toLowerCase()))) {
      cast = cast.replace(/!!+/g, "!");
      cast = cast.replace(/\b(lol|lmao|omg)\b/gi, "");
    }

    return cast;
  } catch (error) {
    console.error("Error generating cast:", error);
    throw new Error("Failed to generate cast");
  }
}

export async function generateTopLevelCast(pet: PetPersonality, topic: CurrentTopic, recentPosts: Post[]): Promise<string> {

  const cast = await generateCasts(pet, topic, recentPosts);

  return cast;
}
