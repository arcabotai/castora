let isLoading = false;
let isLoaded = false;

export const getIsLoaded = () => isLoaded;

export const loadGoogleMaps = (): Promise<void> => {
  if (isLoaded) return Promise.resolve();
  if (isLoading) return new Promise<void>((resolve) => setTimeout(resolve, 100));

  isLoading = true;

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    console.log('Google Maps loading: ', `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}&libraries=places`);
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}&libraries=places`;
    
    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
    };
    
    script.onerror = (error) => {
      isLoading = false;
      reject(error);
    };

    document.head.appendChild(script);
  });
};
