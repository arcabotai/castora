'use client'

import { useSelectedCast } from "@/providers/SelectedCastProvider"
import ExploreColumn from "./ExploreColumn"
import CastDetailColumn from "./CastDetailColumn"
import { useState, useEffect } from 'react'

export default function RightColumn() {
  const { hash } = useSelectedCast()

  return (
    <div>
      <div className={`${!hash ? 'block' : 'hidden'}`}>
        <ExploreColumn />
      </div>
      <div className={`${!!hash ? 'block' : 'hidden'}`}>
        <CastDetailColumn />
      </div>
    </div>
  )
}