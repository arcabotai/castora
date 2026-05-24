'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';

interface InteractionContextType {
  likedCasts: Map<string, { liked: boolean, count: number }>;
  recastedCasts: Map<string, { recasted: boolean, count: number }>;
  addLikedCast: (castHash: string, previousCount: number) => void;
  removeLikedCast: (castHash: string, previousCount: number) => void;
  getLikeCount: (castHash: string) => number;
  isLiked: (castHash: string) => boolean;
  addRecastedCast: (castHash: string, previousCount: number) => void;
  removeRecastedCast: (castHash: string, previousCount: number) => void;
  getRecastCount: (castHash: string) => number;
  isRecasted: (castHash: string) => boolean;
  isOverridden: (castHash: string, overriddenType: 'like' | 'recast') => boolean;
}

const InteractionContext = createContext<InteractionContextType | undefined>(undefined);

export const InteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [likedCasts, setLikedCasts] = useState<Map<string, { liked: boolean, count: number }>>(new Map());
  const [recastedCasts, setRecastedCasts] = useState<Map<string, { recasted: boolean, count: number }>>(new Map());

  const isOverridden = (castHash: string, overriddenType: 'like' | 'recast') => {
    return overriddenType === 'like' ? likedCasts.has(castHash) : recastedCasts.has(castHash)
  }

  const addLikedCast = (castHash: string, previousCount: number) => {
    setLikedCasts(prev => new Map(prev).set(castHash, { liked: true, count: previousCount + 1 }));
  };

  const removeLikedCast = (castHash: string, previousCount: number) => {
    setLikedCasts(prev => new Map(prev).set(castHash, { liked: false, count: previousCount - 1 }));
  };

  const getLikeCount = (castHash: string) => {
    return likedCasts.get(castHash)?.count || 0;
  };

  const isLiked = (castHash: string) => {
    return likedCasts.get(castHash)?.liked || false;
  };

  const addRecastedCast = (castHash: string, previousCount: number) => {
    setRecastedCasts(prev => new Map(prev).set(castHash, { recasted: true, count: previousCount + 1 }));
  };

  const removeRecastedCast = (castHash: string, previousCount: number) => {
    setRecastedCasts(prev => new Map(prev).set(castHash, { recasted: false, count: previousCount - 1 }));
  };

  const getRecastCount = (castHash: string) => {
    return recastedCasts.get(castHash)?.count || 0;
  };

  const isRecasted = (castHash: string) => {
    return recastedCasts.get(castHash)?.recasted || false;
  };

  return (
    <InteractionContext.Provider value={{
      likedCasts,
      recastedCasts,
      addLikedCast,
      removeLikedCast,
      getLikeCount,
      isLiked,
      addRecastedCast,
      removeRecastedCast,
      getRecastCount,
      isRecasted,
      isOverridden
    }}>
      {children}
    </InteractionContext.Provider>
  );
};

export const useInteractions = () => {
  const context = useContext(InteractionContext);
  if (context === undefined) {
    throw new Error('useInteractions must be used within an InteractionProvider');
  }
  return context;
};
