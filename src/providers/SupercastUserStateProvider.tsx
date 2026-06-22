'use client'

import { SupercastUserState } from '@/types';
import { HOST_URL } from '@/utils/hostURL';
import { PLAN } from '@prisma/client';
import { usePrivy } from '@privy-io/react-auth';
import axios from 'axios';
import posthog from 'posthog-js';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from 'react-query';
import { SUPERANON_ADMIN_FIDS } from '@/utils/anon/admin'

const guestSupercastUserState: SupercastUserState = {
  accounts: [],
  userFid: 0,
  currentFid: 0,
  plan: '',
};

type SupercastUserStateType = {
  supercastUserState: SupercastUserState | null;
  setSuperCastUserState: React.Dispatch<React.SetStateAction<SupercastUserState | null>>;
  isAuthenticated: () => boolean;
  isGuest: () => boolean;
  isRegularUser: () => boolean;
  isSuperMember: () => boolean;
  isSuperanon: () => boolean;
  isAdmin: () => boolean;
  getCurrentProfile: () => any | null;
  switchAccount: (fid: number) => void;
  // True when Privy says we're signed in but /api/user/state is still loading or
  // retrying — i.e. we don't yet know if this is a real user or a guest.
  isReconnecting: () => boolean;
  // True when /api/user/state failed (e.g. a transient 503) after retries. Callers
  // must show a retry state, NOT fall through to the guest / onboarding flow.
  hasLoadError: () => boolean;
};

const SupercastUserStateContext = createContext<SupercastUserStateType | null>(null);

export const SupercastUserStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [supercastUserState, setSuperCastUserState] = useState<SupercastUserState | null>(() => {
    if (typeof window !== 'undefined') {
      const storedState = localStorage.getItem('supercastUserState');
      return storedState ? JSON.parse(storedState) : null;
    }
    return null;
  });

  const { ready: privyUserReady, authenticated, getAccessToken } = usePrivy();

  const getCurrentProfile = () => {
    return supercastUserState?.accounts.find(account => account.fid === supercastUserState.currentFid) || null;
  };

  const isAuthenticated = () => privyUserReady && authenticated
  const isGuest = () => isAuthenticated() && !!supercastUserState && supercastUserState.userFid === 0;
  const isRegularUser = () => isAuthenticated() && !!supercastUserState && supercastUserState.userFid !== 0;
  const isSuperMember = () => isRegularUser() && supercastUserState.plan === PLAN.PERSONAL;
  const isSuperanon = () => isSuperMember() && supercastUserState.currentFid === Number(process.env.NEXT_PUBLIC_SUPERANON_FID);
  const isAdmin = () => !!supercastUserState && SUPERANON_ADMIN_FIDS.includes(supercastUserState.userFid);

  const switchAccount = (fid: number) => {
    setSuperCastUserState({ ...supercastUserState, currentFid: fid });
  };

  const posthogIdentify = (userFid, username) => {
    // identify the user in posthog, only 1 time per 24 hours
    if (!localStorage.getItem('posthogIdentifiedTime') || new Date().getTime() - JSON.parse(localStorage.getItem('posthogIdentifiedTime')) > 24 * 60 * 60 * 1000) {
      posthog.identify(userFid, {
        username: username,
        fid: userFid,
      })
      localStorage.setItem('posthogIdentifiedTime', JSON.stringify(new Date().getTime()))
    }
  }

  const posthogLogin = (userFid) => {
    // capture the login event, only 1 time per 4 hours
    if (!localStorage.getItem('posthogLoginTime') || new Date().getTime() - JSON.parse(localStorage.getItem('posthogLoginTime')) > 4 * 60 * 60 * 1000) {
      posthog.capture('login', {
        asFid: userFid,
      })
      localStorage.setItem('posthogLoginTime', JSON.stringify(new Date().getTime()))
    }
  }

  const fetchUserState = async () => {
    const accessToken = await getAccessToken();
    const response = await axios.get(`${HOST_URL}/api/user/state`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data;
  };

  const supercastUserStateQuery = useQuery(
    ['supercastUserState', supercastUserState?.userFid],
    fetchUserState,
    {
      enabled: privyUserReady && authenticated,
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      // A 401/403 is a genuine auth failure — don't retry. A transient 5xx (e.g. the
      // 503 isAuthenticated now returns on a DB/Privy blip) or network error should be
      // retried with backoff so a brief outage doesn't surface as an error.
      retry: (failureCount, error) => {
        const status = (error as any)?.response?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // 1s, 2s, 4s, …
    });

  // Privy authenticated, but we don't yet have a definitive user/state answer.
  const isReconnecting = () => isAuthenticated() && supercastUserStateQuery.isLoading;
  // Privy authenticated, but user/state failed after retries (transient outage).
  const hasLoadError = () => isAuthenticated() && supercastUserStateQuery.isError;

  useEffect(() => {
    if (privyUserReady && !authenticated) {
      setSuperCastUserState(guestSupercastUserState);
    }
  }, [privyUserReady, authenticated]);

  useEffect(() => {
    if (supercastUserStateQuery.data) {
      if (supercastUserStateQuery.data.state.userFid !== 0) {
        const idenfityFid = supercastUserStateQuery.data.state.userFid
        const username = supercastUserStateQuery.data.state.accounts.find((account) => account.fid === supercastUserStateQuery.data.state.userFid).username;
        posthogIdentify(idenfityFid, username);
      }

      const currentlyLoggedInFid = supercastUserState?.currentFid
      const supercastPrivyUserFid = supercastUserStateQuery.data.state.userFid

      const currentFid = (currentlyLoggedInFid && supercastUserStateQuery.data.state.accounts.find((account) => account.fid === currentlyLoggedInFid))
        ? currentlyLoggedInFid
        : supercastPrivyUserFid;

      posthogLogin(currentFid);

      const newSupercastUserState = {
        accounts: supercastUserStateQuery.data.state.accounts,
        userFid: supercastPrivyUserFid,
        currentFid: currentFid,
        plan: supercastUserStateQuery.data.state.plan,
      }

      setSuperCastUserState(newSupercastUserState);
    }
  }, [supercastUserStateQuery.data]);

  useEffect(() => {
    // if the user is coming from a link with a fid, set the currentFid to that fid. used for multiple accounts
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const fid = urlParams.get('fid');
      if (fid) {
        setSuperCastUserState(prevState => ({ ...prevState, plan: PLAN.PERSONAL, currentFid: parseInt(fid) }));
      }
    }
  }, []);

  useEffect(() => {
    // While user/state is failing, don't clobber a possibly-good cached state with a
    // null/guest value — but DO persist real updates (e.g. switchAccount) so the
    // user's account selection isn't lost during a transient outage.
    if (supercastUserStateQuery.isError && (!supercastUserState || supercastUserState.userFid === 0)) return;
    // Save currentFid to localStorage whenever it changes
    localStorage.setItem('supercastUserState', JSON.stringify(supercastUserState));
  }, [supercastUserState, supercastUserStateQuery.isError]);

  return (
    <SupercastUserStateContext.Provider value={{
      supercastUserState,
      setSuperCastUserState,
      isAuthenticated,
      isGuest,
      isRegularUser,
      isSuperMember,
      isSuperanon,
      isAdmin,
      getCurrentProfile,
      switchAccount,
      isReconnecting,
      hasLoadError
    }}>
      {children}
    </SupercastUserStateContext.Provider>
  );
};

export const useSupercastUserState = () => {
  const context = useContext(SupercastUserStateContext);
  if (!context) {
    throw new Error('useSupercastUserState must be used within a SupercastUserStateProvider');
  }
  return context;
};
