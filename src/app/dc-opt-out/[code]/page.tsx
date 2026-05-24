'use client'

import React, { useEffect, useState } from 'react';
import { Switch } from "@/components/ui/switch"
import { useQuery } from 'react-query';
import axios from 'axios';
import { HOST_URL } from '@/utils/hostURL';
import Spinner from '@/components/Spinner';

export default function OptOut({ params }: { params: { code: string } }) {

  const code = params.code;

  const [optOutPersonal, setOptOutPersonal] = useState(false);
  const [optOutGlobal, setOptOutGlobal] = useState(false);
  const [targetUsername, setTargetUsername] = useState('')

  const fetchOptOut = async () => {
    return axios.get(`${HOST_URL}/api/dc-opt-out/${code}`)
      .then((response) => {
        setTargetUsername(response.data.targetUsername)
        setOptOutPersonal(response.data.personalOptOut)
        setOptOutGlobal(response.data.globalOptOut)
        return response.data
      })
  }

  const optOutQuery = useQuery('optOut', fetchOptOut)

  const handleOptOutRequest = async (optOutType: 'personalOptOut' | 'globalOptOut', newValue: boolean) => {

    if (optOutType === 'personalOptOut') setOptOutPersonal(newValue)
    if (optOutType === 'globalOptOut') setOptOutGlobal(newValue)

    await axios.post(`${HOST_URL}/api/dc-opt-out/${code}`, {
      [optOutType]: newValue
    })
      .then((response) => {
        console.log(response.data)
      })
  }


  return (
    <div className='flex items-center justify-center pt-40'>
      {optOutQuery.isLoading && <Spinner />}
      {optOutQuery.isError && <div>Error fetching opt outs</div>}
      {optOutQuery.isSuccess && (
        <div className='flex flex-col'>
          <h1 className='text-2xl font-semibold tracking-tight mb-4'>Opt out from boost requests</h1>
          <div className="flex items-center gap-x-2 mb-2">
            <Switch
              checked={!optOutPersonal && !optOutGlobal}
              onCheckedChange={() => handleOptOutRequest('personalOptOut', !optOutPersonal)}
            />
            Allow boost requests from @{targetUsername}
          </div>
          <div className="flex items-center gap-x-2">
            <Switch
              checked={!optOutGlobal}
              onCheckedChange={() => handleOptOutRequest('globalOptOut', !optOutGlobal)}
            />
            Allow boost requests from people you follow
          </div>
        </div>
      )}
    </div>
  )
};
