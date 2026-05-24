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

    if (isNewUser) {
      setSuperCastUserState({
        currentFid: 0,
        accounts: [],
        userFid: 0,
        plan: PLAN.FREE
      });
    }

    const accessToken = await getAccessToken();

    axios.post(`${HOST_URL}/api/user`, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }).then((response) => {
      queryClient.invalidateQueries("supercastUserState");
    }).catch((error) => {
      console.log(error)
    });
  };

  const { login } = useLogin({
    onComplete: onCompletedLogin,
    onError: (error) => {
      console.log(error);
    },
  });

  return { login };
}; 