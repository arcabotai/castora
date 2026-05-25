'use client'

import { Fragment, useState, useRef, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Image from 'next/image'
import axios from 'axios'
import { HOST_URL } from '@/utils/hostURL'
import { toast } from 'sonner'

import { buildIpfsGatewayUrl, uploadFileClientSide } from '@/utils/upload'
import { usePrivy } from '@privy-io/react-auth'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { useOpenSignerApproval } from '@/providers/OpenSignerApprovalProvider'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Skeleton } from '../ui/skeleton'
import { TrashIcon } from '@heroicons/react/24/outline'
import { Loader2 } from 'lucide-react'
import { useQueryClient } from 'react-query'

import { http, useSignTypedData, useAccount } from 'wagmi'
import { optimism } from "viem/chains";
import { createPublicClient } from 'viem'
import { FarcasterNetwork } from '@farcaster/hub-web'
import EcosystemConnectWalletButton from '../ecosystem/EcosystemConnectWalletButton'
import { truncateEthAddress } from '@/utils/textUtils'

import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { loadGoogleMaps } from '@/utils/googleMapsLoader'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const EIP_712_FARCASTER_DOMAIN = {
  name: "Farcaster Verify Ethereum Address",
  version: "2.0.0",
  // fixed salt to minimize collisions
  salt: "0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558" as `0x${string}`,
}

const EIP_712_FARCASTER_VERIFICATION_CLAIM = [
  {
    name: "fid",
    type: "uint256",
  },
  {
    name: "address",
    type: "address",
  },
  {
    name: "blockHash",
    type: "bytes32",
  },
  {
    name: "network",
    type: "uint8",
  },
]

interface EditProfileButtonProps {
  displayName: string
  username: string
  avatar: string
  bio: string
  connectedAddresses: string[]
  location: {
    coordinates: Coordinates | null
    formatted_address: string | ''
  }
}

interface Coordinates {
  lat: number;
  lng: number;
}

export default function EditProfileButton(props: EditProfileButtonProps) {
  const [openEditProfile, setOpenEditProfile] = useState(false)

  const [displayName, setDisplayName] = useState(props.displayName)
  const [username, setUsername] = useState(props.username)
  const [avatar, setAvatar] = useState(props.avatar)
  const [bio, setBio] = useState(props.bio)
  const [location, setLocation] = useState(props.location.formatted_address || '')
  const [coordinates, setCoordinates] = useState<Coordinates | null>(props.location.coordinates)
  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken } = usePrivy()
  const { setOpenSignerApproval } = useOpenSignerApproval()

  const [loading, setLoading] = useState(false)
  const [loadingRemoveAddress, setLoadingRemoveAddress] = useState(false)
  const [loadingVerifyAddress, setLoadingVerifyAddress] = useState(false)

  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false);

  const inputFile = useRef(null);

  const { data: ethSignature, signTypedData } = useSignTypedData()
  const { address } = useAccount()
  const [blockHash, setBlockHash] = useState<string>()

  const publicClient = createPublicClient({
    chain: optimism,
    transport: http(),
  });

  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  const {
    ready,
    suggestions: { status, data },
    setValue: setPlacesValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    callbackName: 'SUPERCAST_MAPS_CALLBACK',
    requestOptions: {
      types: ['(cities)']
    },
    debounce: 200,
    initOnMount: isGoogleMapsLoaded,
    cache: 24 * 60 * 60, // 24 hour cache
  });

  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        setIsGoogleMapsLoaded(true);
        console.log('Google Maps loaded successfully');
      })
      .catch((error) => console.error('Failed to load Google Maps:', error));
  }, []);

  useEffect(() => {
    if (props.location.formatted_address && isGoogleMapsLoaded) {
      setLocation(props.location.formatted_address);
      setPlacesValue(props.location.formatted_address, false);
    }
  }, [props.location.formatted_address, isGoogleMapsLoaded]);

  const handleLocationChange = (value: string) => {
    setLocation(value);
    setPlacesValue(value);
  };

  const handleSelect = async (address: string) => {
    setLocation(address);
    setPlacesValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const coords = await getLatLng(results[0]);
      setCoordinates(coords);
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  const handleUploadAvatar = async (e) => {

    setUploading(true);
    const accessToken = await getAccessToken();
    uploadFileClientSide(e.target.files[0], { accessToken, asFid: supercastUserState.currentFid })
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
    setLoading(true)
    const accessToken = await getAccessToken()

    const updateData = {
      display_name: displayName,
      pfp_url: avatar,
      bio,
      ...(coordinates && {
        location: {
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          address: {
            city: location.split(',')[0].trim(),
            country: location.split(',')[1].trim(),
          }
        }
      })
    }

    // Get the current query data
    const previousData = queryClient.getQueryData(['profilePage', username])

    // Optimistically update the cache
    queryClient.setQueryData(['profilePage', username], (old: any) => ({
      ...old,
      user: {
        ...old.user,
        display_name: displayName,
        pfp_url: avatar,
        profile: {
          ...old.user.profile,
          bio: { text: bio },
          location: coordinates ? {
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            address: {
              city: location.split(',')[0].trim(),
              country: location.split(',')[1].trim(),
              country_code: old.user.profile.location?.address?.country_code || ''
            }
          } : null
        }
      }
    }))

    axios.patch(`${HOST_URL}/api/profile/update`, updateData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    }).then((response) => {
      setOpenEditProfile(false)
      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['profilePage', username] })
    }).catch((error) => {
      // On error, rollback to previous data
      queryClient.setQueryData(['profilePage', username], previousData)

      if (error.response.data.error === "NO_SIGNER_APPROVED") {
        setOpenSignerApproval(true)
      } else {
        toast.error('Error updating the profile')
      }
    }).finally(() => {
      setLoading(false)
    })
  }

  const handleRemoveAddress = async (address: string) => {
    setLoadingRemoveAddress(true)

    const accessToken = await getAccessToken()

    await axios.delete(`${HOST_URL}/api/verifications/remove`, {
      data: {
        address: address
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    }).then((response) => {
      queryClient.invalidateQueries({ queryKey: ['profilePage', username] })
    }).catch((error) => {
      console.log(error)
      toast.error('Error removing the address')
    }).finally(() => {
      setLoadingRemoveAddress(false)
    })
  }

  const prepareAddressVerificationSignature = async () => {
    const latestBlock = await publicClient.getBlock()

    const localBlockHash = latestBlock.hash
    setBlockHash(localBlockHash)

    console.log({
      fid: supercastUserState.currentFid,
      address,
      network: FarcasterNetwork.MAINNET,
      blockHash: localBlockHash,
    })

    signTypedData({
      domain: EIP_712_FARCASTER_DOMAIN,
      types: { VerificationClaim: EIP_712_FARCASTER_VERIFICATION_CLAIM },
      message: {
        fid: supercastUserState.currentFid,
        address: address,
        network: FarcasterNetwork.MAINNET,
        blockHash: localBlockHash,
      },
      account: address,
      primaryType: "VerificationClaim",
    })
  }

  const handleVerifyAddress = async () => {
    setLoadingVerifyAddress(true)

    const accessToken = await getAccessToken()

    await axios.post(`${HOST_URL}/api/verifications/add`,
      {
        address: address,
        eth_signature: ethSignature,
        block_hash: blockHash
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'asFid': supercastUserState.currentFid,
        }
      }).then((response) => {
        queryClient.invalidateQueries({ queryKey: ['profilePage', username] })
      }).catch((error) => {
        console.log(error)
        toast.error('Error verifying the address')
      }).finally(() => {
        setLoadingVerifyAddress(false)
      })
  }

  useEffect(() => {
    if (ethSignature) {
      handleVerifyAddress()
    }
  }, [ethSignature])

  // make sure it's up to date with parent profile component
  useEffect(() => {
    setDisplayName(props.displayName)
    setBio(props.bio)
    setLocation(props.location.formatted_address || '')
    setCoordinates(props.location.coordinates)
  }, [props])

  return (
    <div className='w-full'>
      <Button
        onClick={() => setOpenEditProfile(true)}
        variant='outline'
        className='w-full'
      >
        Edit profile
      </Button>
      <Transition.Root show={openEditProfile} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setOpenEditProfile}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className='flex flex-col gap-y-4'>
                    <div className='flex flex-row justify-center w-full'>
                      <input
                        type="file"
                        id="file"
                        ref={inputFile}
                        onChange={handleUploadAvatar}
                        className='hidden'
                      />
                      <Avatar className='h-20 w-20 ring-2 ring-gray-500'>
                        <AvatarImage
                          src={avatar}
                          alt='Profile picture'
                          className={`hover:cursor-pointer ${uploading ? 'opacity-50 animate-pulse' : ''}`}
                          onClick={() => inputFile.current.click()}
                        />
                        <AvatarFallback>
                          <Skeleton
                            className="h-20 w-20"
                          />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className='w-full'>
                      <label className='text-xs font-medium'>Display name</label>
                      <input
                        type='text'
                        value={displayName}
                        className='w-full border rounded-md px-3 py-2 focus:outline-none text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
                        placeholder='woj'
                        onChange={(e) => setDisplayName(e.target.value)}
                        data-1p-ignore
                      />
                    </div>
                    <div className='w-full'>
                      <label className='text-xs font-medium'>Bio</label>
                      <input
                        type='text'
                        value={bio}
                        className='w-full border rounded-md px-3 py-2 focus:outline-none text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
                        placeholder='Building with Castora'
                        onChange={(e) => setBio(e.target.value)}
                        data-1p-ignore
                      />
                    </div>
                    <div className='w-full'>
                      <label className='text-xs font-medium'>Location</label>
                      <Popover open={status === "OK"}>
                        <PopoverTrigger asChild>
                          <input
                            type='text'
                            value={location}
                            onChange={(e) => handleLocationChange(e.target.value)}
                            disabled={!ready}
                            className='w-full border rounded-md px-3 py-2 focus:outline-none text-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
                            placeholder={ready ? 'Frankfurt, Germany' : 'Loading...'}
                            data-1p-ignore
                          />
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[200px] overflow-y-auto">
                          {status === "OK" && (
                            <div className="grid">
                              {data.map(({ place_id, description }) => (
                                <button
                                  key={place_id}
                                  onClick={() => {
                                    handleSelect(description);
                                  }}
                                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                >
                                  {description}
                                </button>
                              ))}
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className='w-full'>
                      <label className='text-xs font-medium'>Connected addresses</label>
                      <div className='flex flex-col gap-y-2 mb-2'>
                        {props.connectedAddresses.map((address) => (
                          <div key={address} className='flex flex-row items-center justify-between gap-x-2'>
                            <p className='text-sm lg:hidden'>{truncateEthAddress(address)}</p>
                            <p className='text-sm hidden lg:block'>{address}</p>
                            <button
                              type='button'
                              className='w-6 h-6 hover:cursor-pointer text-red-500 border p-1 rounded-md border-red-500 flex flex-row items-center justify-center'
                              onClick={() => handleRemoveAddress(address)}
                              disabled={loadingRemoveAddress}
                            >
                              {loadingRemoveAddress ? <Loader2 className='w-4 h-4 animate-spin' /> : <TrashIcon className='w-4 h-4' />}
                            </button>
                          </div>
                        ))}
                        {props.connectedAddresses.length === 0 && <p className='text-sm text-gray-500'>No connected addresses</p>}
                      </div>
                      <div className='flex flex-row gap-x-2 w-full'>
                        <Button
                          variant='secondary'
                          size="xs"
                          className='w-full'
                          onClick={() => prepareAddressVerificationSignature()}
                          disabled={loadingVerifyAddress || !address}
                        >
                          {loadingVerifyAddress ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Verify new'}
                        </Button>
                        <EcosystemConnectWalletButton />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleUpdateProfile()
                      }}
                      type="button"
                      className="flex flex-row items-center w-full justify-center rounded-md mt-2 bg-gray-900 dark:bg-gray-200 px-3 py-2 text-sm font-semibold text-white dark:text-gray-900 shadow-sm hover:bg-gray-800 dark:hover:bg-gray-300"
                    >
                      {loading && <div role="status" className='flex flex-row justify-center'>
                        {/* TODO refactor the spinner component */}
                        <svg aria-hidden="true" className="w-4 h-4 mr-3 text-gray-200 animate-spin dark:text-gray-600 fill-gray-900" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                          <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                        </svg>
                        <span className="sr-only">Loading...</span>
                      </div>}
                      Save
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  )
}
