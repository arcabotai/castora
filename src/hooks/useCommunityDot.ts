import { useState, useEffect } from 'react';

export const useCommunityDot = () => {
  const [showDot, setShowDot] = useState(false);

  useEffect(() => {
    const hasVisitedCommunity = localStorage.getItem('hasVisitedCommunity2');
    setShowDot(!hasVisitedCommunity);
  }, []);

  const handleCommunityClick = () => {
    localStorage.setItem('hasVisitedCommunity2', 'true');
    setShowDot(false);
  };

  return { showDot, handleCommunityClick };
};