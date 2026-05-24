import { useState, useEffect } from 'react';

interface SafariNavigator extends Navigator {
  standalone?: boolean;
}

const useIsPWA = () => {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const checkIfPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInstalled = (window.navigator as SafariNavigator).standalone;

      // iOS detection
      const isIOSPWA = isInstalled ||
        window.navigator.userAgent.includes('Mobile/') &&
        document.referrer === '';

      // Android detection
      const isAndroidPWA = isStandalone ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches;

      setIsPWA(isIOSPWA || isAndroidPWA);
    };

    checkIfPWA();

    // Listen for changes in display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkIfPWA);

    return () => mediaQuery.removeEventListener('change', checkIfPWA);
  }, []);

  return isPWA;
};

export default useIsPWA;