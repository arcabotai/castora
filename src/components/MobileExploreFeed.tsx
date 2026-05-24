'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'

import { ArrowPathIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { useMobileSidebar } from '@/providers/MobileSidebarProvider'
import ExploreColumn from './ExploreColumn'
import FeedHeader from './FeedHeader'

export default function MobileExploreFeed() {
  return (
    <div className='lg:hidden pt-12 lg:pt-0'>
      <FeedHeader title="Explore" />
      <ExploreColumn />
    </div>
  )
}