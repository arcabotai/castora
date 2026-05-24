'use client'

import { formatNumber, truncateLongWord } from '@/utils/textUtils'
import { Button } from '../ui/button'
import MoxieLogo from '../assets/MoxieLogo'

import {
  useSendTransaction,
  useWaitForTransactionReceipt,
  useAccount,
  useReadContract,
  useWriteContract,
  useSwitchChain,
} from 'wagmi'

import { erc20Abi } from 'viem'

import { parseEther } from 'viem'
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import EcosystemConnectWalletButton from './EcosystemConnectWalletButton'
import axios from 'axios'
import { HOST_URL } from '@/utils/hostURL'
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider'
import { usePrivy } from '@privy-io/react-auth'
import { useQuery } from 'react-query'
import { Skeleton } from '../ui/skeleton'
import { MoxieAirdropContractABI } from '@/abi/MoxieAirdropContractABI'
import { isMobile } from 'react-device-detect'
import posthog from 'posthog-js'
import { base } from 'viem/chains'
import { useConfetti } from '@/contexts/ConfettiContext'
import { MoxieScoreAccordion } from '../MoxieScoreAccordion'

interface MoxieWidgetProps { }

export default function MoxieWidget(props: MoxieWidgetProps) {
  const { triggerConfetti } = useConfetti()

  const { supercastUserState } = useSupercastUserState()
  const { ready, authenticated, getAccessToken } = usePrivy()
  const account = useAccount()
  const [airdropContract, setAirdropContract] = useState<string | null>(null)
  const [moxieClaimTransactionId, setMoxieClaimTransactionId] = useState<string | null>(null)
  const [moxieClaimInProgress, setMoxieClaimInProgress] = useState(false)
  const [moxieClaimSuccess, setMoxieClaimSuccess] = useState(false)

  const { switchChain } = useSwitchChain()

  const { data: moxieBalanceData, isSuccess: moxieBalanceIsSuccess, refetch: refetchBalanceOfMoxie } = useReadContract({
    abi: erc20Abi,
    functionName: 'balanceOf',
    address: '0x8C9037D1Ef5c6D1f6816278C7AAF5491d24CD527',
    args: [account.address],
    chainId: base.id,
  })

  const { data: currentBalance, isSuccess: currentContractBalanceIsSuccess } = useReadContract({
    abi: MoxieAirdropContractABI,
    address: airdropContract as `0x${string}`,
    functionName: 'currentBalance',
    query: { enabled: !!airdropContract },
    chainId: base.id,
  })

  const { data: releasableAmount, isSuccess: releasableAmountIsSuccess } = useReadContract({
    abi: MoxieAirdropContractABI,
    address: airdropContract as `0x${string}`,
    functionName: 'releasableAmount',
    query: { enabled: !!airdropContract },
    chainId: base.id,
  })

  const { data: vestedAirdropTxHash, writeContract } = useWriteContract()

  const { isLoading: isConfirmingVestedAirdropTx, isSuccess: isConfirmedVestedAirdropTx } = useWaitForTransactionReceipt({ hash: vestedAirdropTxHash })

  const fetchFanTokenPortfolio = async () => {
    const accessToken = await getAccessToken()

    const response = await axios.get(`${HOST_URL}/api/moxie-fan-portfolio?addresses=${account.address},${airdropContract}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    });

    return response.data;
  }


  const fetchAirdropContract = async (): Promise<string | null> => {
    if (!account.address) return null;

    // Check local storage first
    const storedContract = localStorage.getItem(`airdropContract_${account.address}`);
    if (storedContract) {
      return JSON.parse(storedContract);
    }

    // If not in local storage, fetch from API
    const accessToken = await getAccessToken()
    const response = await axios.get(`${HOST_URL}/api/moxie-airdrop-contract?address=${account.address}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    });

    const contractAddress = response.data.address;

    // Store the result in local storage
    localStorage.setItem(`airdropContract_${account.address}`, JSON.stringify(contractAddress));
    return contractAddress;
  }

  const moxieAirdropContractQuery = useQuery(
    ['moxieAirdropContract', account.address],
    fetchAirdropContract,
    {
      enabled: !!supercastUserState && account.isConnected,
      onSuccess: (data) => {
        setAirdropContract(data);
      }
    }
  );

  const moxieFanTokenPortfolioQuery = useQuery(
    ['moxieFanTokenPortfolio', supercastUserState],
    fetchFanTokenPortfolio,
    { enabled: !!supercastUserState && account.isConnected && !!airdropContract && ready && authenticated }
  );

  useEffect(() => {
    if (account.address) {
      const storedContract = localStorage.getItem(`airdropContract_${account.address}`);
      if (storedContract) {
        setAirdropContract(JSON.parse(storedContract));
      }
    }
  }, [account.address]);

  const handleClaimVestedAirdrop = async () => {

    switchChain({ chainId: base.id });

    // @ts-ignore wtf, works
    writeContract({
      address: airdropContract as `0x${string}`,
      abi: MoxieAirdropContractABI,
      functionName: 'release',
      args: [],
      chainId: base.id,
    });

    if (isMobile) {
      toast.message('Go to your wallet to confirm the transaction');
    }
  }

  useEffect(() => {
    if (isConfirmedVestedAirdropTx) {
      if (isMobile) {
        toast.success('Moxie airdrop claimed successfully');
      }
      refetchBalanceOfMoxie();
      posthog.capture('moxie_airdrop_claimed', {
        asFid: supercastUserState.currentFid,
        address: account.address,
      });
    }
  }, [isConfirmedVestedAirdropTx]);

  return (
    <div
      className={`flex flex-col gap-y-2 py-2 px-4 focus:outline-none dark:border-gray-700 rounded-xl border`}
    >
      <div className='flex flex-row items-center gap-x-1 justify-between'>
        <h3 className='text-xl font-semibold'>Moxie</h3>
        <EcosystemConnectWalletButton />
      </div>
      <div className={`flex flex-col gap-y-1 ${!account.isConnected && 'opacity-50'} transition-opacity duration-500`}>
        <div className='text-sm flex flex-row items-center justify-between py-1'>
          <div className="font-base">Fan token portfolio</div>
          {account.isConnected && (
            moxieFanTokenPortfolioQuery.isSuccess
              ?
              <p className='px-3 font-semibold flex flex-row items-center gap-x-1'>
                <MoxieLogo width={4} height={4} />
                {formatNumber(moxieFanTokenPortfolioQuery.data.totalValue)}
              </p>
              :
              <Skeleton className='w-16 h-5' />
          )}
        </div>
        <div className='text-sm flex flex-row items-center justify-between py-1'>
          <div className="font-base">Moxie balance</div>
          {account.isConnected && (
            moxieBalanceIsSuccess
              ?
              <p className='px-3 font-semibold flex flex-row items-center gap-x-1'>
                <MoxieLogo width={4} height={4} />
                {formatNumber(Number(moxieBalanceData) / 10 ** 18)}
              </p>
              :
              <Skeleton className='w-16 h-5' />
          )}
        </div>
        {airdropContract !== "0x0" && (
          <div className='text-sm flex flex-row items-center justify-between py-1'>
            <div className="font-base">Unvested airdrop</div>
            {account.isConnected && (
              (currentContractBalanceIsSuccess && releasableAmountIsSuccess)
                ?
                <p className='px-3 font-semibold flex flex-row items-center gap-x-1'>
                  <MoxieLogo width={4} height={4} />
                  {formatNumber(Math.max(((Number(currentBalance) - Number(releasableAmount)) / 10 ** 18), 0))}
                </p>
                :
                <Skeleton className='w-16 h-5' />
            )}
          </div>
        )}
        {airdropContract !== "0x0" && (
          <div className='flex flex-row items-center justify-between'>
            <div className="text-sm font-base py-1">Vested airdrop</div>
            {account.isConnected && (
              releasableAmountIsSuccess
                ?
                <Button
                  variant="moxie"
                  size="xs"
                  className={`w-28 ${isConfirmedVestedAirdropTx ? 'animate-pulse' : ''}`}
                  onClick={() => handleClaimVestedAirdrop()}
                  disabled={isConfirmingVestedAirdropTx || isConfirmedVestedAirdropTx || Number(releasableAmount) === 0}
                >
                  {isConfirmingVestedAirdropTx
                    ? 'Confirming...'
                    : (isConfirmedVestedAirdropTx || Number(releasableAmount) === 0)
                      ? 'Claimed'
                      : `Claim ${formatNumber(Number(releasableAmount) / 10 ** 18)}`
                  }
                </Button>
                :
                <Skeleton className='w-28 h-7 bg-[#6A2DE0] dark:bg-[#8E55FF]' />
            )}
          </div>
        )}
        <MoxieScoreAccordion />
        <div className='text-xs font-base py-1 flex flex-row justify-center text-gray-500'>
          <p>
            Learn more at <a href='https://www.moxie.xyz/' target='_blank' rel='noreferrer' className='underline'>moxie.xyz</a>
          </p>
        </div>
      </div>
    </div>
  )
}
