import { NextRequest } from 'next/server';
import axios from 'axios';
import { isAuthenticated } from '@/utils/auth/isAuthenticated';
import { isAuthorized } from '@/utils/auth/isAuthorized';
import { getAllMemberFids } from '@/utils/members';
import { LocationGroups } from '../types';

import Redis from 'ioredis'

const CACHE_TTL = 86400 // 24 hours in seconds
const redis = new Redis(process.env.REDIS_URL!)

export async function GET(req: NextRequest) {
  try {
    const { authenticated, supercastUser } = await isAuthenticated(req)

    if (!authenticated) {
      return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
    }

    const targetFid = Number(req.headers.get("asFid"))

    // Check cache first
    const cacheKey = `location-groups:supermembers`
    const cachedDataString = await redis.get(cacheKey)
    const cachedData = cachedDataString ? JSON.parse(cachedDataString) : null

    if (cachedData) {
      return Response.json(cachedData)
    }

    // Fetch following users
    const superUsers = await fetchAllSuperUsers();

    // Calculate location groups
    const locationGroups: LocationGroups = {};

    // Add super users
    superUsers.forEach(user => {
      if (user?.profile?.location?.latitude) {
        const key = `${user.profile.location.longitude},${user.profile.location.latitude}`;
        const userData = {
          username: user.username,
          name: user.display_name || user.username,
          coordinates: [user.profile.location.longitude, user.profile.location.latitude],
          profilePicture: user.pfp_url || '/user.png'
        };

        if (!locationGroups[key]) {
          locationGroups[key] = [];
        }
        locationGroups[key].push(userData);
      }
    });

    // Cache the result
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(locationGroups));

    return Response.json(locationGroups);
  } catch (error) {
    console.error('Error fetching location groups:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function fetchAllSuperUsers() {
  const allUsers = [];
  const memberFids = await getAllMemberFids();

  // Process users in chunks of 100
  for (let i = 0; i < memberFids.length; i += 100) {
    const chunk = memberFids.slice(i, i + 100);
    try {
      const response = await axios.get(
        `https://api.neynar.com/v2/farcaster/user/bulk?fids=${chunk.join(',')}`,
        {
          headers: {
            "api_key": process.env.NEYNAR_API_KEY
          }
        }
      );

      if (response.status === 200 && response.data.users) {
        allUsers.push(...response.data.users);
      }
    } catch (error) {
      console.error('Error fetching bulk users:', error);
    }
  }

  return allUsers;
}