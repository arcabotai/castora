type UserPersonality = {
  description: string;
  interests: string[];
  traits: string[];
  channels: string[];
  randomFacts: string[];
  friend_usernames: string[];
  occupations: string[];
}

type PetPersonality = {
  description: string;
  interests: string[];
  traits: string[];
  name: string;
  species: string;
  pfp_url: string;
  ownerId: string;
  ownerUsername: string;
}

type PetCharacter = "male" | "female" | "baby";

type CurrentTopic = {
  topic: string;
  context: string;
  author: string;
  keywords: string[];
}

type Post = {
  text: string;
  likes_count: number;
  reposts_count: number;
  comments_count: number;
  channel_id?: string;
}

type ProfileInfo = {
  display_name: string;
  username: string;
  pfp_url: string;
  bio: string;
  follower_count: number;
  following_count: number;
}

export type { UserPersonality, PetPersonality, PetCharacter, CurrentTopic, Post, ProfileInfo };
