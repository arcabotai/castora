'use client'

import Layout from '../components/Layout'
import RightColumn from '@/components/RightColumn';

import dynamic from 'next/dynamic';

const Feed = dynamic(() => import('../components/Feed'), { ssr: false });

export default function Home() {

  return (
    <Layout
      currentTab='Home'
      main={<Feed />}
      rightColumn={<RightColumn />}
    />
  )
}
