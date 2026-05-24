import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';
import { usePrivy } from '@privy-io/react-auth';
import axios from 'axios';
import { HOST_URL } from '@/utils/hostURL';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ExploreListPreviewRowProps {
  list: any
}

export default function ExploreListPreviewRow(props: ExploreListPreviewRowProps) {
  const { list } = props;
  const [isFollowing, setIsFollowing] = useState(list.followingStatus);
  const [isLoading, setIsLoading] = useState(false);
  const { supercastUserState } = useSupercastUserState();
  const { getAccessToken } = usePrivy();

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event propagation
    e.preventDefault(); // Prevent default behavior

    setIsLoading(true);
    const accessToken = await getAccessToken();

    try {
      if (isFollowing) {
        // Unfollow the list
        await axios.post(`${HOST_URL}/api/lists/${list.id}/unfollow`, {}, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'asFid': supercastUserState.currentFid,
          }
        });
      } else {
        // Follow the list
        await axios.post(`${HOST_URL}/api/lists/${list.id}/follow`, {}, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'asFid': supercastUserState.currentFid,
          }
        });
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error toggling follow status:', error);
      toast.error('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col py-2 px-1">
      <div className="flex flex-row justify-between items-center">
        <div className='flex flex-col gap-y-1'>
          <span className='text-lg dark:text-gray-100 font-semibold'>{list.name}</span>
          <span className='text-xs text-gray-500'>by @{list.author.username}</span>
          <div className='flex flex-row items-center h-4'>
            <span className='text-xs text-gray-500'>{list.membershipCount} members</span>
            <span className='text-gray-500 mx-1'>·</span>
            <span className='text-xs text-gray-500'>{list.followingCount} followers</span>
          </div>
        </div>
        <div className="flex flex-row items-center space-x-2">
          {list.author.fid !== supercastUserState.currentFid &&
            <Button
              onClick={handleFollowToggle}
              disabled={isLoading}
              variant={isFollowing ? "secondary" : "default"}
              size="sm"
              className="w-24"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                isFollowing ? 'Following' : 'Follow'
              )}
            </Button>
          }
        </div>
      </div>
    </div>
  )
}
