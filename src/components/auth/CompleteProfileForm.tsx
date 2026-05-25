'use client'

import { Fragment, useState, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { CameraIcon, StarIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import axios from 'axios'
import { HOST_URL } from '@/utils/hostURL'
import { Toaster, toast } from 'sonner'

import { buildIpfsGatewayUrl, uploadFileClientSide } from '@/utils/upload'
import { UploadIcon } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'

interface CompleteProfileFormProps {
  displayName: string
  username: string
  avatar: string
  bio: string
  fid: number
  currentLoading: number
  setCurrentLoading: (loading: number) => void
}


export default function CompleteProfileForm(props: CompleteProfileFormProps) {

  const [displayName, setDisplayName] = useState(props.displayName)
  const [avatar, setAvatar] = useState(props.avatar)
  const [bio, setBio] = useState(props.bio)
  const [uploading, setUploading] = useState(false);

  const { getAccessToken } = usePrivy()
  const router = useRouter()

  const inputFile = useRef(null);

  const handleUploadAvatar = async (e) => {

    setUploading(true);
    const accessToken = await getAccessToken();
    uploadFileClientSide(e.target.files[0], { accessToken, asFid: props.fid })
      .then((res) => {
        setAvatar(buildIpfsGatewayUrl(res.IpfsHash, res.uploadedFilename))
        toast.success('File uploaded successfully');
      })
      .catch((e) => {
        toast.error(e.message);
      })
      .finally(() => {
        setUploading(false);
      });
  };

  const handleUpdateProfile = async () => {

    props.setCurrentLoading(3)
    const accessToken = await getAccessToken();

    const updateData = {
      display_name: displayName,
      pfp_url: avatar,
      bio,
    }

    axios.patch(`${HOST_URL}/api/profile/update`, updateData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'asFid': props.fid,
      }
    }).then((response) => {
      toast.success('Profile updated!')
      router.push(`/?fid=${props.fid}`)
    }).catch((error) => {
      toast.error('Something went wrong.')
      console.log(error)
    }).finally(() => {
      props.setCurrentLoading(0)
    })
  }

  return (
    <div className='flex flex-col'>
      <Toaster richColors />
      <p className="text-sm font-semibold tracking-tight">Complete your profile</p>
      <p className="text-xs">Add a profile picture, display name and bio so people can recognize you</p>
      <div className='flex flex-row w-full mt-4 gap-x-4 items-center'>
        <div>
          <input
            type="file"
            id="file"
            ref={inputFile}
            onChange={handleUploadAvatar}
            className='hidden'
          />
          {avatar ? (
            <div className='flex justify-center items-center h-16 w-16'>
              <Image
                src={avatar}
                alt='Profile picture'
                width={80}
                height={80}
                className={`h-16 w-16 overflow-hidden object-cover rounded-full bg-gray-100 hover:cursor-pointer hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 hover:opacity-75 ${uploading ? 'animate-pulse' : ''}`}
                onClick={() => inputFile.current.click()}
              />
            </div>
          ) : (
            <div
              className={`flex justify-center items-center h-16 w-16 border dark:border-gray-700 overflow-hidden object-cover rounded-full bg-gray-100 hover:cursor-pointer hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 hover:opacity-75 ${uploading ? 'animate-pulse' : ''}`}
              onClick={() => inputFile.current.click()}
            >
              <CameraIcon className='h-6 w-6' />
            </div>
          )}
        </div>
        <div className='w-full'>
          <div className='w-full'>
            <input
              type='text'
              value={displayName}
              className='w-full border rounded-md px-3 py-2 focus:outline-none text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
              placeholder='Display name'
              onChange={(e) => setDisplayName(e.target.value)}
              data-1p-ignore
            />
          </div>
          <div className='w-full'>
            <label className='text-xs font-medium ml-2.5'>@{props.username}</label>
          </div>
        </div>
      </div>
      <div className='w-full my-4'>
        <input
          type='text'
          value={bio}
          className='w-full border rounded-md px-3 py-2 focus:outline-none text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
          placeholder={'Bio'}
          onChange={(e) => setBio(e.target.value)}
          data-1p-ignore
        />
      </div>
      <Button
        onClick={() => {
          handleUpdateProfile()
        }}
        disabled={!displayName || !bio || !avatar || props.currentLoading === 3}
      >
        Complete
      </Button>
    </div>
  )
}
