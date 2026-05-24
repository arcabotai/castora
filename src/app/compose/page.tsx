'use client'

import Layout from "@/components/Layout"
import RightColumn from '@/components/RightColumn';
import { useDraftComposeWindow } from "@/providers/DraftComposeWindowProvider";
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import dynamic from 'next/dynamic';

const Feed = dynamic(() => import('@/components/Feed'), { ssr: false });

export default function Compose() {
  const searchParams = useSearchParams();
  const { setOpenDraftComposeWindow, setInitialText, setInitialEmbeds } = useDraftComposeWindow();

  useEffect(() => {
    const text = searchParams.get('text');
    const embedUrl = searchParams.get('embed_url');

    // Reset both states first
    setInitialText('');
    setInitialEmbeds([]);

    // Then set the new values together
    if (text || embedUrl) {
      if (text) {
        setInitialText(decodeURIComponent(text));
      }
      if (embedUrl) {
        setInitialEmbeds([{ url: decodeURIComponent(embedUrl) }]);
      }
      setOpenDraftComposeWindow(true);
    }
  }, [searchParams]);

  return <Layout
    currentTab='Home'
    main={<Feed />}
    rightColumn={<RightColumn />}
  />
}
