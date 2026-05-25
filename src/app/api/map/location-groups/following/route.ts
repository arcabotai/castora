import { NextRequest } from 'next/server';
import axios from 'axios';
import { isAuthenticated } from '@/utils/auth/isAuthenticated';
import { isAuthorized } from '@/utils/auth/isAuthorized';
import { HOST_URL } from '@/utils/hostURL';
import { LocationGroups } from '../types';

import { redis } from '@/utils/redis'

const CACHE_TTL = 86400 // 24 hours in seconds

export async function GET(req: NextRequest) {
  try {
    const { authenticated, supercastUser } = await isAuthenticated(req)

    if (!authenticated) {
      return Response.json({ 'error': 'Not authenticated' }, { status: 401 })
    }

    const targetFid = Number(req.headers.get("asFid"))
    const token = req.headers.get("authorization")?.split(" ")[1]

    const { authorized } = await isAuthorized(supercastUser, targetFid)

    if (!authorized) {
      return Response.json({ 'error': 'Unauthorized' }, { status: 403 })
    }

    // Check cache first
    const cacheKey = `location-groups:following:${targetFid}`
    const cachedDataString = await redis.get(cacheKey)
    const cachedData = cachedDataString ? JSON.parse(cachedDataString) : null

    if (cachedData) {
      return Response.json(cachedData)
    }

    // Fetch current user
    const currentUser = await axios.get(`${HOST_URL}/api/profile?fid=${targetFid}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'asFid': targetFid,
      }
    });

    // Fetch following users
    const following = await fetchAllFollowing(targetFid, token);

    // Calculate location groups
    const locationGroups: LocationGroups = {};

    // Add current user if they have location
    if (currentUser.data.user?.profile?.location?.latitude) {
      const key = `${currentUser.data.user.profile.location.longitude},${currentUser.data.user.profile.location.latitude}`;
      locationGroups[key] = [{
        username: currentUser.data.user.username,
        name: currentUser.data.user.display_name || currentUser.data.user.username,
        coordinates: [currentUser.data.user.profile.location.longitude, currentUser.data.user.profile.location.latitude],
        profilePicture: currentUser.data.user.pfp_url || '/user.png'
      }];
    }

    // Add following users
    following.forEach(user => {
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

async function fetchAllFollowing(fid: number, token: string) {
  let cursor = '';
  const allUsers = [];

  while (true) {
    const response = await axios.get(
      `${HOST_URL}/api/profile/following?followingFid=${fid}&cursor=${cursor}&type=following`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'asFid': fid,
        }
      }
    );

    allUsers.push(...response.data.users);

    if (!response.data.cursor) break;
    cursor = response.data.cursor;
  }

  return allUsers;
}