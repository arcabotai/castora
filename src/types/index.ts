type User = {
  fid: number;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  followerCount: number;
  followingCount: number;
  powerBadge?: boolean;
  connectedAddress: string;
  following?: boolean;
  followedBy?: boolean;
}

type UserMin = {
  fid: number;
  username: string;
  displayName: string;
  avatar: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  connectedAddress?: string;
  powerBadge?: boolean;
  connected?: boolean;
  sharedWith?: boolean;
}

type CastId = {
  fid: number;
  hash: string;
}

type Embed = {
  url?: string;
  castId?: CastId;
}

type Cast = {
  hash: string;
  author: UserMin;
  parent_url: string;
  parentHash?: string;
  text: string;
  embeds: Embed[];
  replyCount: number;
  recastCount: number;
  reactionCount: number;
  bookmarkCount: number;
  replyStatus: boolean;
  recastStatus: boolean;
  reactionStatus: boolean;
  bookmarkStatus: boolean;
  timestamp: number;
  frames: any[]; // TODO
};

type Channel = {
  id: string
  name: string
  created_at: number
  description: string
  image_url: string
  follower_count?: number
  parent_url?: string
}

type SupercastUserState = {
  accounts: UserMin[];
  userFid: number;
  currentFid: number;
  plan: string;
}

export type { Cast, User, UserMin, Embed, Channel, SupercastUserState };