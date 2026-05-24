import React, { useEffect, useState } from 'react';
import { formatNumber } from '@/utils/textUtils';
import { Button } from '../ui/button';
import {
  useAccount,
  useBalance,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { erc20Abi } from 'viem';
import EcosystemConnectWalletButton from './EcosystemConnectWalletButton';
import axios from 'axios';
import { HOST_URL } from '@/utils/hostURL';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';
import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from 'react-query';
import { Skeleton } from '../ui/skeleton';
import { InformationCircleIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import DegenLogo from '../assets/DegenLogo';
import { LockedDegenContractABI } from '@/abi/LockedDegenContractABI';
import { isMobile } from 'react-device-detect';
import { toast } from 'sonner';
import { DegenAirdropContractABI } from '@/abi/DegenAirdropContractABI';
import posthog from 'posthog-js';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import { base, degen } from 'viem/chains';

const DEGEN_TOKEN_ADDRESS = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed";
const WDEGEN_TOKEN_ADDRESS = "0xEb54dACB4C2ccb64F8074eceEa33b5eBb38E5387"
const LOCKED_DEGEN_TOKEN_ADDRESS = "0xa8a30E0dafCA4156f28d96cCa5671a0eEcA5E407";

const AIRDROP_CONTRACT_ADDRESS = "0x08D830997d53650AAf9194F0d9Ff338b6f814fce";
const CURRENT_DEGEN_SEASON = 12;
const LOCK_DURATION = 7776000;
const MINIMUM_LOCK_AMOUNT = 10000;

export default function DegenWidget() {

  const [timeToUnlock, setTimeToUnlock] = useState(null);

  const DEGEN_LOCK_EXPLANATION = `Degen tokens are live on Base and Degen. You will be able to bridge between them in supercast soon.`;
  const DEGEN_UNLOCK_EXPLANATION = `Lock your DEGEN for 90 days to get tip allowance. Minimum 10k tokens required to lock. Time remaining to unlock: ${(timeToUnlock / 1000 / 60 / 60 / 24).toPrecision(2)} days.`;

  const { supercastUserState } = useSupercastUserState();
  const { getAccessToken } = usePrivy();
  const account = useAccount();
  const { switchChain } = useSwitchChain()

  const STORAGE_KEY = `degenWidgetDataSeason${CURRENT_DEGEN_SEASON}_${supercastUserState.currentFid}_${account.address}`;

  const [widgetData, setWidgetData] = useState({
    lastSeasonPoints: 0,
    remainingAllowance: 0,
    dailyAllowance: 0,
    currentSeasonPoints: 0,
    airdropData: null,
  });

  const [shouldFetchFromAPI, setShouldFetchFromAPI] = useState(false);

  const { data: degenBalance, isSuccess: degenBalanceIsSuccess, refetch: refetchDegenBalance } = useReadContract({
    abi: erc20Abi,
    functionName: 'balanceOf',
    address: DEGEN_TOKEN_ADDRESS,
    args: [account.address],
    chainId: base.id,
  });

  const { data: wdegenBalanceDegenChain, isSuccess: wdegenBalanceDegenChainIsSuccess, refetch: refetchWdegenBalanceDegenChain } = useReadContract({
    abi: erc20Abi,
    functionName: 'balanceOf',
    address: WDEGEN_TOKEN_ADDRESS,
    chainId: degen.id,
    args: [account.address],
  });

  // read native balance on degen chain
  const { data: degenNativeBalance, isSuccess: degenNativeBalanceIsSuccess, refetch: refetchDegenNativeBalance } = useBalance({
    address: account.address,
    chainId: degen.id,
    query: { enabled: !!account.isConnected },
  })

  const { data: degenLockedContractAllowance, refetch: refetchLockedContractAllowance } = useReadContract({
    address: DEGEN_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [account.address, LOCKED_DEGEN_TOKEN_ADDRESS],
    chainId: base.id,
  });

  const { data: lockedDegenBalance, isSuccess: lockedDegenBalanceIsSuccess, isError: lockedDegenBalanceIsError, refetch: refetchLockedDegenBalance } = useReadContract({
    address: LOCKED_DEGEN_TOKEN_ADDRESS,
    abi: LockedDegenContractABI,
    functionName: 'balanceOf',
    args: [account.address],
    chainId: base.id,
  });

  const { data: lockedDegenDepositTimestamp } = useReadContract({
    address: LOCKED_DEGEN_TOKEN_ADDRESS,
    abi: LockedDegenContractABI,
    functionName: 'depositTimestamps',
    args: [account.address],
    chainId: base.id,
  });

  const { data: isAirdropClaimed } = useReadContract({
    address: AIRDROP_CONTRACT_ADDRESS,
    abi: DegenAirdropContractABI,
    functionName: 'isClaimed',
    chainId: degen.id,
    args: [widgetData.airdropData?.index],
    query: { enabled: !!widgetData.airdropData },
  });

  const { data: approveDegenTxHash, writeContract: writeContractApproveDegen } = useWriteContract()

  const { isLoading: isConfirmingApproveDegen, isSuccess: isSuccessApproveDegen } = useWaitForTransactionReceipt({ hash: approveDegenTxHash })

  const { data: lockDegenTxHash, writeContract: writeContractLockDegen } = useWriteContract()

  const { isLoading: isConfirmingLockDegen, isSuccess: isSuccessLockDegen } = useWaitForTransactionReceipt({ hash: lockDegenTxHash })

  const { data: unlockDegenTxHash, writeContract: writeContractUnlockDegen } = useWriteContract()

  const { isLoading: isConfirmingUnlockDegen, isSuccess: isSuccessUnlockDegen } = useWaitForTransactionReceipt({ hash: unlockDegenTxHash })

  const { data: claimAirdropTxHash, writeContract: writeContractClaimAirdrop } = useWriteContract()

  const { isLoading: isConfirmingClaimAirdrop, isSuccess: isSuccessClaimAirdrop } = useWaitForTransactionReceipt({ hash: claimAirdropTxHash })

  const handleLockDegen = async () => {

    switchChain({ chainId: base.id });

    if (Number(degenLockedContractAllowance) < Number(degenBalance)) {
      // @ts-ignore
      writeContractApproveDegen({
        address: DEGEN_TOKEN_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [LOCKED_DEGEN_TOKEN_ADDRESS, degenBalance],
        chainId: base.id,
      });

      if (isMobile) {
        toast.message('Go to your wallet to confirm the transaction');
      }

      return;
    }

    // @ts-ignore
    writeContractLockDegen({
      address: LOCKED_DEGEN_TOKEN_ADDRESS as `0x${string}`,
      abi: LockedDegenContractABI,
      functionName: 'deposit',
      args: [degenBalance],
      chainId: base.id,
    });

    if (isMobile) {
      toast.message('Go to your wallet to confirm the transaction');
    }
  }

  const handleUnlockDegen = async () => {

    switchChain({ chainId: base.id });
    // @ts-ignore
    writeContractUnlockDegen({
      address: LOCKED_DEGEN_TOKEN_ADDRESS as `0x${string}`,
      abi: LockedDegenContractABI,
      functionName: 'withdraw',
      args: [lockedDegenBalance],
      chainId: base.id,
    });

    if (isMobile) {
      toast.message('Go to your wallet to confirm the transaction');
    }
  }

  const handleClaimAirdrop = async () => {
    switchChain({ chainId: degen.id });

    // @ts-ignore
    writeContractClaimAirdrop({
      address: AIRDROP_CONTRACT_ADDRESS as `0x${string}`,
      abi: DegenAirdropContractABI,
      functionName: 'claim',
      args: [
        widgetData.airdropData.index,
        widgetData.airdropData.wallet_address,
        widgetData.airdropData.amount,
        widgetData.airdropData.proof
      ],
      chainId: degen.id,
    });

    if (isMobile) {
      toast.message('Go to your wallet to confirm the transaction');
    }
  }

  useEffect(() => {
    if (isSuccessApproveDegen) {
      refetchLockedContractAllowance();
    }
  }, [isSuccessApproveDegen]);

  useEffect(() => {
    if (isSuccessLockDegen) {
      refetchDegenBalance();
      refetchLockedContractAllowance();

      posthog.capture('degen_locked', {
        asFid: supercastUserState.currentFid,
        address: account.address,
      });

      if (isMobile) {
        toast.success('Degen tokens locked successfully');
      }
    }
  }, [isSuccessLockDegen]);

  useEffect(() => {
    if (isSuccessClaimAirdrop) {
      refetchWdegenBalanceDegenChain();

      posthog.capture('degen_airdrop_claimed', {
        asFid: supercastUserState.currentFid,
        address: account.address,
      });

      if (isMobile) {
        toast.success('Degen airdrop claimed successfully');
      }
    }
  }, [isSuccessClaimAirdrop]);

  useEffect(() => {
    if (isSuccessUnlockDegen) {
      refetchDegenBalance();
      refetchLockedContractAllowance();

      posthog.capture('degen_unlocked', {
        asFid: supercastUserState.currentFid,
        address: account.address,
      });

      if (isMobile) {
        toast.success('Degen tokens unlocked successfully');
      }
    }
  }, [isSuccessUnlockDegen]);

  useEffect(() => {
    // whenever the lockedDegenDepositTimestamp changes, we need to update the timeToUnlock.
    // time to unlock is the difference between the current time and the deposit timestamp.
    // if the deposit is older than 90 days, time to unlock is 0.
    if (lockedDegenDepositTimestamp) {
      const depositTimestamp = Number(lockedDegenDepositTimestamp) * 1000;
      const now = new Date().getTime();
      const timeDifference = now - depositTimestamp;
      const timeToUnlock = LOCK_DURATION * 1000 - timeDifference;
      setTimeToUnlock(timeToUnlock);
    }
  }, [lockedDegenDepositTimestamp]);

  const isDataValid = (storedData) => {
    if (!storedData) return false;
    const { expiry } = JSON.parse(storedData);
    return new Date().getTime() < expiry;
  };

  const getStoredData = () => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return null;

    const { data } = JSON.parse(storedData);
    return data;
  };

  const setStoredData = (data) => {
    const now = new Date();
    const expiryDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 30, 0, 0);
    if (expiryDate <= now) {
      expiryDate.setDate(expiryDate.getDate() + 1);
    }

    const storageData = {
      data,
      expiry: expiryDate.getTime(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
  };

  const fetchDegenWidgetData = async () => {
    const accessToken = await getAccessToken();
    const response = await axios.get(`${HOST_URL}/api/degen/widget-data?address=${account.address}&season=${CURRENT_DEGEN_SEASON}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    });
    setStoredData(response.data);
    return response.data;
  };

  const degenWidgetQuery = useQuery(
    ['degenWidgetQuery', supercastUserState, STORAGE_KEY],
    fetchDegenWidgetData,
    {
      enabled: shouldFetchFromAPI && !!supercastUserState && account.isConnected,
    }
  );

  useEffect(() => {
    if (!!account.address) {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (isDataValid(storedData)) {
        const data = getStoredData();
        setWidgetData({
          lastSeasonPoints: Number(data.lastSeasonPoints) || 0,
          remainingAllowance: Number(data.remainingAllowance) || 0,
          dailyAllowance: Number(data.dailyAllowance) || 0,
          currentSeasonPoints: Number(data.currentSeasonPoints) || 0,
          airdropData: data.airdropData,
        });
      } else {
        setShouldFetchFromAPI(true);
      }
    }
  }, [account.address]);

  useEffect(() => {
    if (degenWidgetQuery.isSuccess && degenWidgetQuery.data) {
      setWidgetData({
        lastSeasonPoints: Number(degenWidgetQuery.data.lastSeasonPoints) || 0,
        remainingAllowance: Number(degenWidgetQuery.data.remainingAllowance) || 0,
        dailyAllowance: Number(degenWidgetQuery.data.dailyAllowance) || 0,
        currentSeasonPoints: Number(degenWidgetQuery.data.currentSeasonPoints) || 0,
        airdropData: degenWidgetQuery.data.airdropData,
      });
      setShouldFetchFromAPI(false);
    }
  }, [degenWidgetQuery.isSuccess, degenWidgetQuery.data]);

  return (
    <div className="flex flex-col gap-y-2 py-2 px-4 focus:outline-none dark:border-gray-700 rounded-xl border">
      <div className='flex flex-row items-center gap-x-1 justify-between'>
        <h3 className='text-xl font-semibold'>Degen</h3>
        <EcosystemConnectWalletButton />
      </div>
      <div className={`flex flex-col gap-y-1 ${!account.isConnected && 'opacity-50'} transition-opacity duration-500`}>
        <div className='flex flex-col gap-y-1 py-1'>
          <div className='text-sm flex flex-row items-center justify-between'>
            <div className='flex flex-row items-center gap-x-1'>
              <div className="text-sm font-base">Degen balance</div>
              {isMobile ? (
                <Drawer>
                  <DrawerTrigger>
                    <InformationCircleIcon className='h-4 w-4' />
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Lock degen</DrawerTitle>
                      <div className='text-sm'>{DEGEN_LOCK_EXPLANATION}</div>
                    </DrawerHeader>
                    <DrawerFooter>
                      <DrawerClose>
                        <Button variant='secondary' className='w-full'>Close</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              ) : (
                <HoverCard>
                  <HoverCardTrigger>
                    <InformationCircleIcon className='h-4 w-4' />
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <div className='text-xs p-2 w-44'>{DEGEN_LOCK_EXPLANATION}</div>
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
            {account.isConnected && (
              (degenNativeBalanceIsSuccess && wdegenBalanceDegenChainIsSuccess) ? (
                <p className='px-3 font-semibold flex flex-row items-center gap-x-1 text-sm'>
                  <DegenLogo width={4} height={4} />
                  {`${formatNumber(Number(degenNativeBalance.value) / 10 ** 18 + Number(wdegenBalanceDegenChain) / 10 ** 18 + Number(degenBalance) / 10 ** 18)}`}
                </p>
              ) : (
                <Skeleton className='w-[130px] h-7' />
              )
            )}
          </div>
          <div className='flex flex-col gap-y-0.5'>
            <div className='flex flex-row items-center justify-between'>
              <div className='flex flex-row items-center gap-x-1'>
                <div className="text-xs font-base">Base</div>
              </div>
              {account.isConnected && (
                (degenBalanceIsSuccess) ? (
                  <p className='px-3 font-medium flex flex-row items-center gap-x-1 text-xs'>
                    <DegenLogo width={3} height={3} />
                    {`${formatNumber(Number(degenBalance) / 10 ** 18)}`}
                  </p>
                ) : (
                  <Skeleton className='w-[130px] h-7' />
                )
              )}
            </div>
            <div className='flex flex-row items-center justify-between'>
              <div className='flex flex-row items-center gap-x-1'>
                <div className="text-xs font-base">Degen chain</div>
              </div>
              {account.isConnected && (
                (degenNativeBalanceIsSuccess && wdegenBalanceDegenChainIsSuccess) ? (
                  <p className='px-3 font-medium flex flex-row items-center gap-x-1 text-xs'>
                    <DegenLogo width={3} height={3} />
                    {`${formatNumber(Number(degenNativeBalance.value) / 10 ** 18 + Number(wdegenBalanceDegenChain) / 10 ** 18)}`}
                  </p>
                ) : (
                  <Skeleton className='w-[130px] h-7' />
                )
              )}
            </div>
          </div>
        </div>
        <div className='flex flex-col gap-y-1'>
          <div className='text-sm flex flex-row items-center justify-between'>
            <div className='flex flex-row items-center gap-x-1'>
              <div className="text-sm font-base">Locked balance</div>
              {isMobile ? (
                <Drawer>
                  <DrawerTrigger>
                    <InformationCircleIcon className='h-4 w-4' />
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Unlock degen</DrawerTitle>
                      <div className='text-sm'>{DEGEN_UNLOCK_EXPLANATION}</div>
                    </DrawerHeader>
                    <DrawerFooter>
                      <DrawerClose>
                        <Button variant='secondary' className='w-full'>Close</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              ) : (
                <HoverCard>
                  <HoverCardTrigger>
                    <InformationCircleIcon className='h-4 w-4' />
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <div className='text-xs p-2 w-44'>{DEGEN_UNLOCK_EXPLANATION}</div>
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
            {account.isConnected && (
              (degenNativeBalanceIsSuccess && wdegenBalanceDegenChainIsSuccess) ? (
                <p className='px-3 font-semibold flex flex-row items-center gap-x-1 text-sm'>
                  <DegenLogo width={4} height={4} />
                  {`${formatNumber(Number(lockedDegenBalance) / 10 ** 18)}`}
                </p>
              ) : (
                <Skeleton className='w-[130px] h-7' />
              )
            )}
          </div>
          <div className='w-full flex flex-row gap-x-2'>
            {account.isConnected && (
              degenBalanceIsSuccess ? (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleLockDegen()}
                  disabled={Number(degenBalance) / 10 ** 18 < MINIMUM_LOCK_AMOUNT || isConfirmingLockDegen || isSuccessLockDegen || isConfirmingApproveDegen}
                  className={`w-1/2 ${(isConfirmingLockDegen || isConfirmingApproveDegen) ? 'animate-pulse' : ''}`}
                >
                  {
                    isConfirmingLockDegen
                      ? 'Locking...'
                      : isConfirmingApproveDegen
                        ? 'Approving...'
                        : isSuccessLockDegen
                          ? 'Locked'
                          : Number(degenBalance) === 0
                            ? 'Wallet empty'
                            : (
                              <span className='flex flex-row items-center gap-x-2 justify-center w-full'>
                                <LockClosedIcon className='h-4 w-4' />
                                {`Lock ${formatNumber(Number(degenBalance) / 10 ** 18)}`}
                              </span>
                            )}
                </Button>
              ) : (
                <Skeleton className='w-1/2 h-7' />
              )
            )}
            {account.isConnected && (
              lockedDegenBalanceIsSuccess ? (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleUnlockDegen()}
                  disabled={Number(lockedDegenBalance) === 0 || isConfirmingUnlockDegen || isSuccessUnlockDegen || timeToUnlock > 0}
                  className={`w-1/2 ${(isConfirmingUnlockDegen) ? 'animate-pulse' : ''}`}
                >
                  {
                    isConfirmingUnlockDegen
                      ? 'Unlocking...'
                      : isSuccessUnlockDegen
                        ? 'Unlocked'
                        : Number(lockedDegenBalance) === 0
                          ? 'Vault empty'
                          : (
                            <span className='flex flex-row items-center gap-x-2 justify-center w-full'>
                              <LockOpenIcon className='h-4 w-4 shrink-0' />
                              {`Unlock ${formatNumber(Number(lockedDegenBalance) / 10 ** 18)}`}
                            </span>
                          )}
                </Button>
              )
                : lockedDegenBalanceIsError
                  ? <span>0</span>
                  : <Skeleton className='w-1/2 h-7' />
            )}
          </div>
        </div>
        <div className='text-sm flex flex-row items-center justify-between py-1'>
          <div className="font-base">Tip allowance</div>
          {account.isConnected && (
            !shouldFetchFromAPI || degenWidgetQuery.isSuccess ? (
              <p className='px-3 font-semibold flex flex-row items-center gap-x-1'>
                <DegenLogo width={4} height={4} />
                {formatNumber(widgetData.remainingAllowance)} / {formatNumber(widgetData.dailyAllowance)}
              </p>
            ) : (
              <Skeleton className='w-16 h-5' />
            )
          )}
        </div>
        <div className='text-sm flex flex-row items-center justify-between py-1'>
          <div className="font-base">{`Season ${CURRENT_DEGEN_SEASON} points`}</div>
          {account.isConnected && (
            !shouldFetchFromAPI || degenWidgetQuery.isSuccess ? (
              <p className='px-3 font-semibold flex flex-row items-center gap-x-1'>
                <DegenLogo width={4} height={4} />
                {formatNumber(widgetData.currentSeasonPoints)}
              </p>
            ) : (
              <Skeleton className='w-16 h-5' />
            )
          )}
        </div>
        <div className='flex flex-row items-center justify-between'>
          <div className="text-sm font-base py-1">{`Season ${CURRENT_DEGEN_SEASON - 1} airdrop`}</div>
          {account.isConnected && (
            !shouldFetchFromAPI || degenWidgetQuery.isSuccess ? (
              <Button
                variant="degen"
                size="xs"
                className={`w-[130px] ${(isConfirmingClaimAirdrop) ? 'animate-pulse' : ''}`}
                disabled={widgetData.lastSeasonPoints === 0 || isConfirmingClaimAirdrop || isSuccessClaimAirdrop || !!isAirdropClaimed}
                onClick={() => handleClaimAirdrop()}
              >
                {
                  isConfirmingClaimAirdrop
                    ? 'Claiming...'
                    : (isSuccessClaimAirdrop || isAirdropClaimed)
                      ? 'Claimed'
                      : widgetData.lastSeasonPoints === 0
                        ? 'Not qualified'
                        : `Claim ${formatNumber(widgetData.lastSeasonPoints)}`
                }
              </Button>
            ) : (
              <Skeleton className='w-[130px] h-7' />
            )
          )}
        </div>
        <div className='text-xs font-base py-1 flex flex-row justify-center text-gray-500'>
          <p>
            Learn more at <a href='https://degen.tips' target='_blank' rel='noreferrer' className='underline'>degen.tips</a>
          </p>
        </div>
      </div>
    </div>
  );
}