'use client';
import { Input } from "@/components/ui/input";
import { HOST_URL } from "@/utils/hostURL";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import axios from "axios";
import { useEffect, useState } from "react";
import { DebounceInput } from "react-debounce-input";

import {
  ID_REGISTRY_EIP_712_TYPES,
  idRegistryABI,
  ID_GATEWAY_ADDRESS,
  ID_REGISTRY_ADDRESS,
} from '@farcaster/hub-web';

import { createWalletClient, createPublicClient, custom, http } from 'viem';
import { mainnet, optimism } from "viem/chains";
import { Button } from "@/components/ui/button";
import CompleteProfileForm from "@/components/auth/CompleteProfileForm";
import { CheckIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { posthog } from "posthog-js";
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider";

const MinSpinner = () => {

  return (
    <div role="status" className='flex flex-row justify-center'>
      <svg aria-hidden="true" className="w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-gray-900" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  )
}


const CreateAccountPage = () => {

  const { user, getAccessToken, ready, signTypedData, logout } = usePrivy();

  const { wallets } = useWallets();

  const [newAccountFid, setNewAccountFid] = useState<number>()
  const [newAccountUsername, setNewAccountUsername] = useState<string>()
  const [isValidUsername, setIsValidUsername] = useState<boolean>()
  const [isAvailableUsername, setIsAvailableUsername] = useState<boolean>()
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [currentLoading, setCurrentLoading] = useState<number>(0)

  const { setSuperCastUserState } = useSupercastUserState()

  const publicClient = createPublicClient({
    chain: optimism,
    transport: http(),
  });

  const fetchOnboardingStage = async () => {
    const accessToken = await getAccessToken();

    axios.get(`${HOST_URL}/api/account/onboarding-stage`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
      .then((response) => {
        setNewAccountFid(response.data.fid)
        setCurrentStep(response.data.stage)
      })
      .catch((error) => {
        console.error(error)
      })
  }


  const createFarcasterAccount = async () => {
    setCurrentLoading(1)
    const accessToken = await getAccessToken();

    axios.post(`${HOST_URL}/api/account/create`, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
      .then((response) => {
        setNewAccountFid(response.data.fid)
        setCurrentStep(2)
      })
      .catch((error) => {
        console.error(error)
      })
      .finally(() => {
        setCurrentLoading(0)
      })
  }

  const validateUsername = async () => {
    if (newAccountUsername) {

      setIsAvailableUsername(undefined)

      const isValid = /^[a-z0-9][a-z0-9-]{0,15}$/.test(newAccountUsername)
      setIsValidUsername(isValid)

      if (!isValid) {
        return
      }

      const accessToken = await getAccessToken();

      axios.get(`${HOST_URL}/api/account/validate-username?username=${newAccountUsername}`, {
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
    }
  }

  const registerUsernameAndTransferOwnership = async () => {
    setCurrentLoading(2)
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
        username: newAccountUsername,
        signature: signature,
        deadline: deadline,
        fid: newAccountFid
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      })
        .then((response) => {
          setCurrentStep(3)
        })
        .catch((error) => {
          console.log(error)
          toast.error('Error while finishing sign up. Please try again.')
        })
        .finally(() => {
          setCurrentLoading(0)
        })

    } catch (error) {
      console.error('SignTypedData error', error);
    }
  };

  useEffect(() => {
    if (ready && user && user.farcaster === undefined) {
      fetchOnboardingStage()
    }
  }, [user, ready]);

  useEffect(() => {
    if (!!newAccountUsername) {
      validateUsername()
    }
  }, [newAccountUsername])

  useEffect(() => {
    if (currentStep === 1) {
      createFarcasterAccount()
    }
  }, [currentStep])

  const handleLogout = async () => {
    posthog.reset()
    logout()
    setSuperCastUserState(null)
    localStorage.clear()
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="sm:w-[700px] mt-24 sm:border rounded-lg px-4 sm:p-12 dark:bg-opacity-50 dark:bg-gray-800">
        <h1 className="font-semibold text-2xl tracking-tight mb-2">Create account</h1>
        <p className="text-slate-500 text-sm">Castora runs on <a className="underline">Farcaster</a>. Your account will work on other apps on the network, like Warpcast, Nook, or Buttrfly.</p>
        <div className="w-full flex flex-row justify-between px-10 py-8">
          <div className="flex flex-col items-center gap-y-1">
            <div className={`rounded-full border dark:border-white w-8 h-8 font-medium flex justify-center items-center ${currentStep > 1 ? 'bg-gray-500 border-gray-500 text-white' : 'border-black'}`}>
              {currentStep > 1 ? <CheckIcon className="w-5 h-5" /> : currentLoading === 1 ? <MinSpinner /> : '1'}
            </div>
            <p className={`text-center text-xs ${currentStep > 1 ? "text-gray-500" : ""}`}>Account registration</p>
          </div>
          <div className="flex flex-col items-center gap-y-1">
            <div className={`rounded-full border dark:border-white w-8 h-8 font-medium flex justify-center items-center ${currentStep > 2 ? 'bg-gray-500 border-gray-500 text-white' : 'border-black'}`}>
              {currentStep > 2 ? <CheckIcon className="w-5 h-5" /> : currentLoading === 2 ? <MinSpinner /> : '2'}
            </div>
            <p className={`text-center text-xs ${currentStep > 2 ? "text-gray-500" : ""}`}>Choose a username</p>
          </div>
          <div className="flex flex-col items-center gap-y-1">
            <div className="rounded-full border dark:border-white border-black w-8 h-8 font-medium flex justify-center items-center">
              {currentStep > 3 ? <CheckIcon className="w-5 h-5" /> : currentLoading === 3 ? <MinSpinner /> : '3'}
            </div>
            <p className="text-center text-xs">Complete profile</p>
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-slate-800 w-full rounded-md">
          {currentStep === 1 && (
            <div>
              <p className="text-sm">We're creating your account. This will take a few seconds.</p>
              <div className="flex justify-center mt-4">
                <div className="loader"></div>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div>
              <p className="text-sm font-semibold tracking-tight">Choose a username</p>
              <p className="text-xs">Your account has been created. Select your username and check if it's available</p>
              <div className="flex flex-col mt-4">
                <DebounceInput
                  className="border border-gray-300 dark:border-black rounded-md p-2 mb-1 text-sm w-full focus:outline-none"
                  minLength={3}
                  debounceTimeout={300}
                  placeholder="Username"
                  onChange={(e) => setNewAccountUsername(e.target.value)}
                  data-1p-ignore
                />
                {(!!newAccountUsername && isValidUsername === false) && (
                  <p className="text-red-500 text-xs">Username is invalid</p>
                )}
                {(!!newAccountUsername && isAvailableUsername === false) && (
                  <p className="text-red-500 text-xs">Username is already taken</p>
                )}
                {(!!newAccountUsername && isAvailableUsername === true) && (
                  <p className="text-green-500 text-xs">Username available</p>
                )}
                <Button
                  className="mt-4"
                  disabled={!isValidUsername || !isAvailableUsername || currentLoading === 2}
                  onClick={() => registerUsernameAndTransferOwnership()}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}
          {currentStep === 3 && <CompleteProfileForm
            displayName={""}
            username={newAccountUsername}
            avatar={""}
            bio={""}
            fid={newAccountFid}
            currentLoading={currentLoading}
            setCurrentLoading={setCurrentLoading}
          />}
        </div>
      </div>
      <div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-gray-600 dark:text-gray-400">Did you mean to log into an existing account?
          <button
            onClick={() => handleLogout()}
            className='ml-1 font-semibold hover:underline'
          >
            Log out {'->'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default CreateAccountPage;
