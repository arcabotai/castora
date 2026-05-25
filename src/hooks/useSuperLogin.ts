import { useLogin, usePrivy } from '@privy-io/react-auth';
import { useQueryClient } from 'react-query';
import axios from 'axios';
import { HOST_URL } from '@/utils/hostURL';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';

import { PLAN } from '@prisma/client';
export const useSuperLogin = () => {
  const { getAccessToken } = usePrivy();
  const { setSuperCastUserState } = useSupercastUserState();

  const queryClient = useQueryClient();

  const onCompletedLogin = async (user: any, isNewUser: boolean, wasAlreadyAuthenticated: boolean) => {
    if (wasAlreadyAuthenticated) {
      return;
    }

    const accessToken = await getAccessToken();

    try {
      await axios.post(`${HOST_URL}/api/user`, {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (isNewUser) {
        setSuperCastUserState({
          currentFid: 0,
          accounts: [],
          userFid: 0,
          plan: PLAN.FREE
        });
      }

      queryClient.invalidateQueries("supercastUserState");
    } catch (error) {
      console.log(error)
    }
  };

  const { login } = useLogin({
    onComplete: onCompletedLogin,
    onError: (error) => {
      console.log(error);
    },
  });

  return { login };
}; 