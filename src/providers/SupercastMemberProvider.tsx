'use client'

import { HOST_URL } from '@/utils/hostURL';
import axios from 'axios';
import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useSupercastUserState } from './SupercastUserStateProvider';
import { useQuery } from 'react-query';

interface SupercastMemberContextType {
  isSupercastMember: (fid: number) => boolean;
}

const SupercastMemberContext = createContext<SupercastMemberContextType | undefined>(undefined);

export const SupercastMemberProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSupercastUserState();

  const fetchSupercastMemberFids = async () => {
    const response = await axios.get(`${HOST_URL}/api/v1/super-members`);
    return response.data.members.map((member: { fid: number }) => member.fid)
  };

  const query = useQuery(
    ['superMembers'],
    fetchSupercastMemberFids,
    {
      enabled: isAuthenticated(),
      staleTime: 6 * 60 * 60 * 1000, // 6 hours
      cacheTime: 6 * 60 * 60 * 1000, // 6 hours
    }
  );

  const isSupercastMember = useCallback(
    (fid: number) => query.data?.includes(fid) ?? false,
    [query.data]
  );

  return (
    <SupercastMemberContext.Provider value={{
      isSupercastMember,
    }}>
      {children}
    </SupercastMemberContext.Provider>
  );
}

export function useSupercastMember(): SupercastMemberContextType {
  const context = useContext(SupercastMemberContext);
  if (context === undefined) {
    throw new Error('useSupercastMember must be used within a SupercastMemberProvider');
  }
  return context;
}