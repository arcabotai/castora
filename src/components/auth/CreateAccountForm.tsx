'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadFileClientSide } from '@/utils/upload';
import { AlertCircle, CheckCircle, Loader2, UploadIcon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { HOST_URL } from '@/utils/hostURL';
import axios from 'axios';
import { createWalletClient, createPublicClient, custom, http } from 'viem';
import { mainnet, optimism } from 'viem/chains';

import {
  ID_REGISTRY_EIP_712_TYPES,
  idRegistryABI,
  ID_GATEWAY_ADDRESS,
  ID_REGISTRY_ADDRESS,
} from '@farcaster/hub-web';
import { useRouter } from 'next/navigation';
import { useCheckoutDialog } from '@/hooks/useCheckoutDialog';
import { CheckoutDialog } from '../checkout/CheckoutDialog';
import { useQueryClient } from 'react-query';
import { DebounceInput } from 'react-debounce-input';

interface CreateAccountFormProps {
  onBack: () => void;
  registrationPaidFor: boolean;
}

export default function CreateAccountForm({
  onBack,
  registrationPaidFor,
}: CreateAccountFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [uploading, setUploading] = useState(false);

  const router = useRouter();

  const [isValidUsername, setIsValidUsername] = useState(undefined);
  const [isAvailableUsername, setIsAvailableUsername] = useState(undefined);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const [newAccountFid, setNewAccountFid] = useState(0);

  const inputFile = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const { user, getAccessToken, ready, signTypedData } = usePrivy();

  const queryClient = useQueryClient()

  const { openCheckout } = useCheckoutDialog();

  const { wallets } = useWallets();

  const publicClient = createPublicClient({
    chain: optimism,
    transport: http(),
  });

  const handlePayForRegistration = async () => {
    openCheckout("REGISTRATION")
  }

  const validateUsername = async () => {
    setIsAvailableUsername(undefined)
    setIsValidUsername(undefined)
    setIsCheckingAvailability(true)
    if (username.length > 0) {
      const isValid = /^[a-z0-9][a-z0-9-]{0,15}$/.test(username)
      setIsValidUsername(isValid)

      if (!isValid) {
        setIsCheckingAvailability(false)
        return
      }

      const accessToken = await getAccessToken();

      axios.get(`${HOST_URL}/api/account/validate-username?username=${username}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
        .then((response) => {
          setIsAvailableUsername(response.data.isAvailable)
        })
        .catch((error) => {
          console.error(error)
        })
        .finally(() => {
          setIsCheckingAvailability(false)
        })
    }
  }

  const reserveFid = async () => {
    const accessToken = await getAccessToken();

    axios.post(`${HOST_URL}/api/account/create`, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
      .then((response) => {
        setNewAccountFid(response.data.fid)
      })
      .catch((error) => {
        console.error(error)
      })
  }

  const registerUsernameAndTransferOwnership = async () => {
    setIsLoading(true);
    // Find Embedded Wallet from the wallets array (from useWallet() or usePrivy() hooks)
    const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');

    // Build a generic EIP-1193 provider from the embedded wallet
    const provider = await embeddedWallet?.getEthereumProvider();
    if (!provider) return;

    // Build a Viem wallet client from the provider
    const walletClient = createWalletClient({
      chain: mainnet,
      transport: custom(provider),
    });

    const getDeadline = () => {
      const now = Math.floor(Date.now() / 1000);
      const oneHour = 60 * 60;
      return now + oneHour;
    };

    const readNonce = async () => {
      return await publicClient.readContract({
        address: ID_REGISTRY_ADDRESS,
        abi: idRegistryABI,
        functionName: 'nonces',
        args: [user.wallet.address as `0x${string}`],
      });
    };

    try {

      const nonce = await readNonce();
      const deadline = getDeadline();

      const message = {
        fid: BigInt(newAccountFid),
        to: embeddedWallet?.address as `0x${string}`,
        nonce: BigInt(nonce),
        deadline: BigInt(deadline),
      }

      // Sign typed data based on Farcaster example 
      // https://docs.farcaster.xyz/developers/guides/accounts/change-custody
      const signature = await walletClient.signTypedData({
        account: embeddedWallet?.address as `0x${string}`,
        ...ID_REGISTRY_EIP_712_TYPES,
        primaryType: 'Transfer',
        message,
      });

      const accessToken = await getAccessToken();

      axios.post(`${HOST_URL}/api/account/finish-registration`, {
        username: username,
        signature: signature,
        deadline: deadline,
        fid: newAccountFid,
        displayName: displayName,
        bio: bio,
        avatar: avatar,
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      })
        .then((response) => {
          queryClient.invalidateQueries({ queryKey: ['supercastUserState'] })
        })
        .catch((error) => {
          console.log(error)
          toast.error(error.response.data.error)
        })
        .finally(() => {
          setIsLoading(false);
        })

    } catch (error) {
      console.error('SignTypedData error', error);
    }
  };

  const handleCreateAccount = async () => {
    registerUsernameAndTransferOwnership();
  };

  const handleUploadAvatar = async (e) => {
    setUploading(true);
    uploadFileClientSide(e.target.files[0])
      .then((res) => {
        setAvatar(`https://supercast.mypinata.cloud/ipfs/${res.IpfsHash}?filename=${res.uploadedFilename}`)
        toast.success('File uploaded successfully');
      })
      .catch((e) => {
        toast.error(e.message);
      })
      .finally(() => {
        setUploading(false);
      });
  };

  useEffect(() => {
    reserveFid();
  }, []);

  useEffect(() => {
    validateUsername()
  }, [username])

  return (
    <div className="flex flex-col items-center justify-center pt-20">
      <Toaster richColors />
      <CheckoutDialog />
      <h1 className="font-semibold text-2xl tracking-tight mb-2 text-center">Create your profile</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-xs text-center leading">
        To use super, you need to create a profile on Farcaster.<br />Farcaster is a decentralized social media platform and has a one time $3 registration fee.
      </p>
      <div className="w-full max-w-md">
        <div className="space-y-4 p-4">
          <div className='flex flex-row justify-center w-full mb-6'>
            <input
              type="file"
              id="file"
              ref={inputFile}
              onChange={handleUploadAvatar}
              className='hidden'
            />
            <Avatar
              className={`h-20 w-20 ring-2 ring-gray-500 hover:cursor-pointer ${uploading ? 'opacity-50 animate-pulse' : ''}`}
              onClick={() => inputFile.current.click()}
            >
              <AvatarImage
                src={avatar}
                alt='Profile picture'
                className='object-cover h-20 w-20'
              />
              <AvatarFallback>
                <div className="h-20 w-20 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <UploadIcon className="h-8 w-8 text-gray-600" />
                  )}
                </div>
              </AvatarFallback>
            </Avatar>
          </div>

          <div className='w-full'>
            <label className='text-xs font-medium'>Display name</label>
            <Input
              type='text'
              value={displayName}
              className='w-full'
              placeholder='Your name'
              onChange={(e) => setDisplayName(e.target.value)}
              data-1p-ignore
            />
          </div>

          <div className='w-full'>
            <label className='text-xs font-medium'>Bio</label>
            <Input
              type='text'
              value={bio}
              className='w-full'
              placeholder='Tell us about yourself'
              onChange={(e) => setBio(e.target.value)}
              data-1p-ignore
            />
          </div>

          <div className='w-full h-24'>
            <label className='text-xs font-medium'>Username</label>
            <DebounceInput
              type='text'
              value={username}
              className={"flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"}
              placeholder='elonmusk'
              onChange={(e) => setUsername(e.target.value)}
              data-1p-ignore
              debounceTimeout={500}
            />
            {username && (
              <div className="mt-2 text-xs">
                {isCheckingAvailability ? (
                  <div className="flex flex-row items-center gap-x-1">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <p className="text-gray-500">Checking availability...</p>
                  </div>
                ) : (
                  <>
                    {(isValidUsername === false) && (
                      <div className="flex flex-row items-center gap-x-1">
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                        <p className="text-red-500">Username must be 1-16 characters long and can only contain lowercase letters, numbers, and hyphens</p>
                      </div>
                    )}
                    {(isValidUsername && (isAvailableUsername === false)) && (
                      <div className="flex flex-row items-center gap-x-1">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <p className="text-red-500">Username is already taken</p>
                      </div>
                    )}
                    {(isValidUsername && (isAvailableUsername === true)) && (
                      <div className="flex flex-row items-center gap-x-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <p className="text-green-500">Username is available</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          {registrationPaidFor ? (
            <Button
              onClick={handleCreateAccount}
              disabled={!isValidUsername || !isAvailableUsername || !displayName || !newAccountFid}
              className="w-full mt-6"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Finish registration"
              )}
            </Button>
          ) : (
            <Button
              onClick={handlePayForRegistration}
              disabled={!isValidUsername || !isAvailableUsername || !displayName || !newAccountFid}
              className="w-full mt-6"
            >
              Pay registration fee — $3
            </Button>
          )}
          <Button
            onClick={onBack}
            variant="ghost"
            className="w-full mt-6"
          >
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
} 