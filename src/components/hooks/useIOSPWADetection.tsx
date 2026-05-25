import { useState, useEffect } from 'react';

export function useIosPwaDetection() {
  const [isIosPwa, setIsIosPwa] = useState(false);

  useEffect(() => {
    const cachedValue = localStorage.getItem('isIosPwa');
    if (cachedValue !== null) {
      setIsIosPwa(cachedValue === 'true');
    } else {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || Boolean((window.navigator as any).standalone);
      const detectedIsIosPwa = isIos && isInStandaloneMode;

      setIsIosPwa(detectedIsIosPwa);
      localStorage.setItem('isIosPwa', detectedIsIosPwa.toString());
    }
  }, []);

  return isIosPwa;
}
