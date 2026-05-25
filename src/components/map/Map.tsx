'use client'

import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Cluster } from 'ol/source';
import { defaults as defaultControls, Zoom } from 'ol/control';
import styles from './Map.module.css';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';
import { Overlay } from 'ol';
import { ArrowsPointingInIcon, ArrowsPointingOutIcon, ArrowUpOnSquareIcon, ShareIcon } from '@heroicons/react/24/outline';
import { useDraftComposeWindow } from '@/providers/DraftComposeWindowProvider';
import { uploadFileClientSide } from '@/utils/upload';
import { toast } from 'sonner';
import { useDraftId } from '@/providers/DraftIdProvider';
import { Loader2 } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import axios from 'axios';
import { HOST_URL } from '@/utils/hostURL';
import { useQuery } from 'react-query';
import { useIosPwa } from '@/providers/iOSPwaProvider';
import { notFound } from 'next/navigation';
import { SUPERANON_ADMIN_FIDS } from '@/utils/anon/admin';
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { classNames } from '@/utils/classNames';
import { LocationGroups } from '@/app/api/map/location-groups/types';

type ViewType = 'following' | 'supermembers';

// Determine if we should show rings based on zoom level and cluster size
const shouldShowRings = (clusterSize: number, zoom: number) => {
  // console.log('shouldShowRings', { clusterSize, zoom })
  if (zoom >= 10) return true;  // Always show rings at high zoom levels
  if (zoom >= 7 && clusterSize <= 20) return true;  // Show rings for small clusters at medium zoom
  if (zoom >= 5 && clusterSize <= 8) return true;  // Show rings for very small clusters at lower zoom
  return false;
};

const createMultiRingClusterHTML = (features: Feature[], zoom: number) => {
  const size = features.length;
  // For single user, always show their profile picture
  if (size === 1) {
    const user = features[0].get('user');
    return `
      <a href="/${user.username}" target="_blank">
      <div class="relative" style="width: 40px; height: 40px;">
        <div class="absolute w-10 h-10 rounded-full overflow-hidden border-2 border-white 
                    hover:scale-110 transition-transform cursor-pointer bg-white shadow-md">
          <img 
            src="${user.profilePicture}" 
            alt="${user.username}"
            class="w-full h-full object-cover"
            onerror="this.src='/user.png'"
          />
        </div>
        </div>
      </a>
    `;
  }

  // If we shouldn't show rings, show simple cluster
  if (!shouldShowRings(size, zoom)) {
    return `
      <div class="relative" style="width: 48px; height: 48px;">
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    bg-white dark:bg-gray-800 rounded-full w-12 h-12 
                    flex items-center justify-center
                    text-gray-900 dark:text-white text-base font-medium 
                    border-2 border-white dark:border-gray-700 
                    shadow-md z-10
                    [outline:2px_solid_rgba(31,41,55,0.1)] dark:outline-0">
          ${size}
        </div>
      </div>
    `;
  }

  // Adjusted configuration for more spaced out rings
  const ringsConfig = [
    { radius: 0, max: 1 },
    { radius: 50, max: 8 },      // First ring
    { radius: 95, max: 12 },     // Second ring
    { radius: 140, max: 16 },    // Third ring
    { radius: 185, max: 20 },    // Fourth ring
    { radius: 230, max: 24 },    // Fifth ring
    { radius: 275, max: 28 },    // Sixth ring
    { radius: 320, max: 32 },    // Seventh ring
    { radius: 365, max: 36 },    // Eighth ring
    { radius: 410, max: 40 },    // Ninth ring
    { radius: 455, max: 44 },    // Tenth ring
  ];

  // Container size needs to be larger to accommodate the wider spacing
  const containerSize = 220;
  const centerPoint = containerSize / 2;

  const distributeAcrossRings = (total: number) => {
    const rings: Feature[][] = [];
    let remainingFeatures = [...features];

    ringsConfig.forEach(({ max }) => {
      if (remainingFeatures.length === 0) return;

      const ringFeatures = remainingFeatures.slice(0, max);
      rings.push(ringFeatures);
      remainingFeatures = remainingFeatures.slice(max);
    });

    return rings;
  };

  const rings = distributeAcrossRings(size);

  return `
    <div class="relative" style="width: ${containerSize}px; height: ${containerSize}px;">
      ${rings.map((ringFeatures, ringIndex) => {
    const { radius } = ringsConfig[ringIndex];
    const angleStep = (2 * Math.PI) / ringFeatures.length;

    return ringFeatures.map((feature, index) => {
      const angle = angleStep * index;
      const x = radius * Math.cos(angle) + centerPoint;
      const y = radius * Math.sin(angle) + centerPoint;
      const user = feature.get('user');

      return `
        <a href="/${user.username}" target="_blank">
            <div 
              class="absolute w-10 h-10 rounded-full overflow-hidden border-2 border-white 
                     hover:scale-110 transition-transform cursor-pointer bg-white shadow-md
                     [outline:2px_solid_rgba(31,41,55,0.1)] dark:outline-0"
              style="transform: translate(${x}px, ${y}px) translate(-50%, -50%)"
            >
              <img 
                src="${user.profilePicture}" 
                alt="${user.username}"
                class="w-full h-full object-cover"
                onerror="this.src='/user.png'"
              />
            </div>
          </a>
          `;
    }).join('');
  }).join('')} 
    </div>
  `;
};

export default function MapComponent() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const overlayElementRef = useRef<HTMLDivElement | null>(null);
  const { getAccessToken, ready: privyReady, authenticated } = usePrivy()
  const { supercastUserState, isAuthenticated, isGuest, isRegularUser } = useSupercastUserState();
  const { setOpenDraftComposeWindow, setInitialText, setInitialEmbeds } = useDraftComposeWindow();
  const [uploading, setUploading] = useState(false);
  const { draftId, setDraftId } = useDraftId()
  const { isIosPwa } = useIosPwa();

  const isSuperanonNonAdmin = supercastUserState.currentFid === Number(process.env.NEXT_PUBLIC_SUPERANON_FID) && !SUPERANON_ADMIN_FIDS.includes(supercastUserState.userFid)

  if (isSuperanonNonAdmin) {
    return notFound()
  }

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewType, setViewType] = useState<ViewType>(isRegularUser() ? 'following' : 'supermembers');

  const locationGroupsQuery = useQuery<LocationGroups>(
    ['locationGroups', supercastUserState.currentFid, viewType],
    async () => {
      const accessToken = await getAccessToken();

      const response = await axios.get<LocationGroups>(
        `${HOST_URL}/api/map/location-groups/${viewType}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'asFid': supercastUserState.currentFid,
        }
      });

      return response.data;
    },
    {
      enabled: isAuthenticated() && !!supercastUserState,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      cacheTime: 30 * 60 * 1000, // Keep unused data in cache for 30 minutes
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 2,
    }
  );
  // Style function for markers
  const styleFunction = () => null;

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Create the map instance
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM({
            attributions: [
              '&copy; <a href="https://www.openstreetmap.org/copyright" class="text-black">OpenStreetMap</a> contributors'
            ],
          }),
        }),
      ],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
      }),
      controls: defaultControls({
        zoom: false,
        attributionOptions: {
          className: styles.mapAttribution,
          collapsible: false,
          label: ''
        },
        rotate: false,
      }).extend([
        new Zoom({
          className: `${styles.mapControl} right-4 top-4`,
          zoomInClassName: styles.mapButton,
          zoomOutClassName: styles.mapButton,
          zoomInLabel: '+',
          zoomOutLabel: '-',
        }),
      ]),
    });

    mapInstanceRef.current = map;

    function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    // Debounced update function
    const debouncedUpdate = debounce(updateOverlays, 200);

    // Add zoom change listener
    map.getView().on('change:resolution', () => {
      debouncedUpdate();
    });

    // Create empty vector layer with clustering
    const vectorLayer = new VectorLayer({
      source: new Cluster({
        distance: 40,
        source: new VectorSource()
      }),
      style: styleFunction
    });

    vectorLayerRef.current = vectorLayer;
    map.addLayer(vectorLayer);

    return () => {
      map.setTarget(undefined);
    };
  }, [locationGroupsQuery.data]);

  const [overlayStates, setOverlayStates] = useState<{ [key: string]: boolean }>({});

  const updateOverlays = () => {
    if (!mapInstanceRef.current || !locationGroupsQuery.data) return;

    const zoom = mapInstanceRef.current.getView().getZoom() || 2;
    const currentOverlays = mapInstanceRef.current.getOverlays();
    const newOverlayStates: { [key: string]: boolean } = {};

    // Process each location group
    Object.entries(locationGroupsQuery.data).forEach(([key, users]) => {

      // Determine if this cluster should show rings

      const shouldShowRingsNow = users.length === 1 || shouldShowRings(users.length, zoom);
      newOverlayStates[key] = shouldShowRingsNow;

      // Only update if the ring display state has changed
      if (shouldShowRingsNow !== overlayStates[key]) {

        const userFeatures = users.map(user => {
          const feature = new Feature();
          feature.set('user', user);
          return feature;
        });

        // Remove existing overlay for this location if it exists
        const existingOverlay = Array.from(currentOverlays.getArray())
          .find((overlay: Overlay) => {
            const pos = overlay.getPosition();
            return pos && pos[0] === fromLonLat(users[0].coordinates)[0] &&
              pos[1] === fromLonLat(users[0].coordinates)[1];
          });

        if (existingOverlay) {
          mapInstanceRef.current.removeOverlay(existingOverlay);
        }

        // Create new overlay
        const element = document.createElement('div');
        element.className = 'absolute -translate-x-1/2 -translate-y-1/2';
        element.innerHTML = createMultiRingClusterHTML(userFeatures, zoom);

        const overlay = new Overlay({
          element: element,
          position: fromLonLat(users[0].coordinates),
          positioning: 'center-center',
          stopEvent: false
        });

        mapInstanceRef.current.addOverlay(overlay);
      }
    });

    // Update overlay states
    setOverlayStates(newOverlayStates);
  };

  const takeScreenshot = async () => {
    try {

      // Take screenshot using browser API
      const stream = await navigator.mediaDevices.getDisplayMedia({
        // @ts-ignore
        preferCurrentTab: true,
        video: {
          displaySurface: "browser"
        }
      });

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      // Create canvas and draw video frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      // Create File object from blob
      const file = new File([blob], 'map-screenshot.png', { type: 'image/png' });

      setUploading(true);
      // Upload the file
      const uploadToken = await getAccessToken();
      const result = await uploadFileClientSide(file, {
        accessToken: uploadToken,
        asFid: supercastUserState.currentFid,
      });

      // Open draft composer with the uploaded image
      setDraftId(null)
      setInitialText("my farcaster family on @supercast map");
      setInitialEmbeds([{
        url: `https://supercast.mypinata.cloud/ipfs/${result.IpfsHash}?filename=${result.uploadedFilename}`
      }]);
      setOpenDraftComposeWindow(true);
      toast.success('Screenshot uploaded successfully');
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        toast.error('Screenshot permission denied');
      } else {
        toast.error('Failed to take screenshot');
      }
      console.error(error);
    } finally {
      setUploading(false);
    }
  };


  // Only once after all the data is fetched and location groups are calculated, update overlays
  useEffect(() => {
    if (locationGroupsQuery.isSuccess) {
      updateOverlays();
    }
  }, [locationGroupsQuery.data]);

  return (
    <div className={`w-full h-screen ${isFullscreen ? 'fixed inset-0 z-[48] overflow-y-auto overscroll-none' : 'relative'}`}>
      <div ref={mapRef} className="w-full h-full" />
      <div
        ref={overlayElementRef}
        className="hidden bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 
                   dark:border-gray-700 max-w-xs w-[300px]"
        style={{ maxHeight: '400px' }}
      />
      <div className={`absolute ${isIosPwa ? (isFullscreen ? 'bottom-16' : 'bottom-28') : (isFullscreen ? 'bottom-6' : 'bottom-20')} lg:bottom-6 left-1/2 -translate-x-1/2 text-lg font-semibold text-gray-900 dark:text-white pointer-events-none select-none flex flex-row items-center`}>
        <img className='w-6 h-6 shrink-0 hidden dark:block' src='/castora-mark.svg' alt='Castora' />
        <img className='w-6 h-6 shrink-0 dark:hidden block' src='/castora-mark.svg' alt='Castora' />
        <span className='ml-2 dark:text-black'>Castora</span>
        <div className="ml-4 flex gap-2 pointer-events-auto">
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="inline-flex w-40 justify-center gap-x-1.5 rounded-md bg-white/80 hover:bg-white dark:bg-gray-900/80 dark:hover:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm">
              {viewType === 'following' ? 'Following' : 'Members'}
              <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute bottom-full left-0 z-10 mb-2 origin-bottom-left rounded-md bg-white dark:bg-gray-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  {['following', 'supermembers'].map((type) => (
                    <Menu.Item key={type}>
                      {({ active }) => (
                        <button
                          onClick={() => {
                            setViewType(type as ViewType);
                            locationGroupsQuery.refetch();
                          }}
                          className={classNames(
                            active ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100' : 'text-gray-700 dark:text-gray-100',
                            'block px-4 py-2 text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed w-40'
                          )}
                          disabled={locationGroupsQuery.isLoading || (type === 'following' && isGuest())}
                        >
                          {type === 'following' ? 'Following' : 'Members'}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded-lg bg-white/80 hover:bg-white dark:bg-gray-900/80 dark:hover:bg-gray-900 shadow-sm flex items-center justify-center w-8 h-8 shrink-0"
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className='w-5 h-5 text-gray-900 dark:text-gray-100' />
            ) : (
              <ArrowsPointingOutIcon className='w-5 h-5 text-gray-900 dark:text-gray-100' />
            )}
          </button>
          <button
            onClick={takeScreenshot}
            disabled={uploading}
            className="p-1 rounded-lg bg-white/80 hover:bg-white dark:bg-gray-900/80 dark:hover:bg-gray-900 shadow-sm flex items-center justify-center w-8 h-8 shrink-0"
          >
            {uploading ? (
              <div className="animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full" />
            ) : (
              <ArrowUpOnSquareIcon className='w-5 h-5 text-gray-900 dark:text-gray-100' />
            )}
          </button>
        </div>
      </div>
      {((locationGroupsQuery.isLoading || locationGroupsQuery.isFetching) && !locationGroupsQuery.data) && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-lg flex flex-row items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <div className="text-sm font-medium">
            Fetching {viewType === "following" ? ("people you follow") : "super members"}
          </div>
        </div>
      )}
    </div>
  );
}