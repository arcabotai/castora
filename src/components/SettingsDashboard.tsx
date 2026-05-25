'use client'
import { ArrowTopRightOnSquareIcon, Bars3Icon } from "@heroicons/react/24/outline"
import { StarIcon, ChevronDownIcon } from "@heroicons/react/20/solid"
import { useMobileSidebar } from '@/providers/MobileSidebarProvider'
import { usePaywall } from "@/providers/PaywallProvider"
import { useTheme } from 'next-themes'
import { Menu, Transition } from '@headlessui/react'
import { classNames } from '@/utils/classNames'

import { Fragment, useEffect, useState } from "react"
import RemoveAccountModal from "./RemoveAccountModal"
import ShareAccountModal from "./ShareAccountModal"
import { useSupercastUserState } from "@/providers/SupercastUserStateProvider"
import { Button } from "./ui/button"
import { usePrivy } from "@privy-io/react-auth"
import posthog from "posthog-js"
import RemoveSharedAccountModal from "./RemoveSharedAccountModal"
import Link from "next/link"
import { AUTH_URL } from "@/utils/authURL"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import axios from "axios"
import { HOST_URL } from "@/utils/hostURL"
import { useQuery } from "react-query"
import Spinner from "./Spinner"
import { toast } from "sonner"
import FeedHeader from "./FeedHeader"
import { notFound, useRouter } from 'next/navigation';
import { Loader2 } from "lucide-react"
import { PAYMENT_METHOD, PAYMENT_TYPE, PLAN, PRODUCT_TYPE } from "@prisma/client"
import { Switch } from "./ui/switch"
import { registerNotificationSubscription } from "@/utils/notifications"
import { SUPERANON_ADMIN_FIDS } from "@/utils/anon/admin"
import { useCheckoutDialog } from "@/hooks/useCheckoutDialog"
import { CheckoutDialog } from "@/components/checkout/CheckoutDialog"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { Skeleton } from "./ui/skeleton"

export default function SettingsDashboard() {
  const { setOpenSidebar } = useMobileSidebar()
  const { theme, setTheme } = useTheme()

  const { supercastUserState, setSuperCastUserState, isAuthenticated, isRegularUser, isSuperMember } = useSupercastUserState()
  const { logout, getAccessToken, user, exportWallet } = usePrivy()
  const [loadingCancelSubscription, setLoadingCancelSubscription] = useState(false)
  const [loadingRefund, setLoadingRefund] = useState(false)
  const [loadingSwitchToOnchainPayment, setLoadingSwitchToOnchainPayment] = useState(false)

  const [openRemoveAccountModal, setOpenRemoveAccountModal] = useState(false)
  const [openRemoveSharedAccountModal, setOpenRemoveSharedAccountModal] = useState(false)
  const [openShareAccountModal, setOpenShareAccountModal] = useState(false)
  const [removeAccountFid, setRemoveAccountFid] = useState<number>(0)
  const [removeSharedAccountFid, setRemoveSharedAccountFid] = useState<number>(0)
  const [shareAccountFid, setShareAccountFid] = useState<number>(0)
  const [shareAccountUsername, setShareAccountUsername] = useState<string>('')

  const isSuperanonNonAdmin = supercastUserState.currentFid === Number(process.env.NEXT_PUBLIC_SUPERANON_FID) && !SUPERANON_ADMIN_FIDS.includes(supercastUserState.userFid)

  if (isSuperanonNonAdmin) {
    return notFound()
  }

  const fetchBillingData = async () => {

    const accessToken = await getAccessToken()

    const response = await axios.get(`${HOST_URL}/api/account/billing`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    })
    return response.data
  }

  const billingQuery = useQuery('billingData', fetchBillingData, { enabled: isRegularUser() })

  const fetchStorageData = async () => {

    const accessToken = await getAccessToken()

    const response = await axios.get(`${HOST_URL}/api/account/storage`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    })
    return response.data
  }

  const storageQuery = useQuery(
    ['storageData'],
    fetchStorageData,
    { enabled: isRegularUser() }
  )

  const { openCheckout } = useCheckoutDialog()

  const handleExtendSubscription = () => {
    openCheckout(PRODUCT_TYPE.MEMBERSHIP)
  }

  const handlePurchaseStorage = () => {
    openCheckout(PRODUCT_TYPE.STORAGE)
  }

  const handleRemoveAccount = (e: React.MouseEvent<HTMLButtonElement>, fid: number) => {
    e.stopPropagation()
    e.preventDefault()
    setRemoveAccountFid(fid)
    setOpenRemoveAccountModal(true)
  }

  const handleRemoveSharedAccount = (e: React.MouseEvent<HTMLButtonElement>, fid: number) => {
    e.stopPropagation()
    e.preventDefault()
    setRemoveSharedAccountFid(fid)
    setOpenRemoveSharedAccountModal(true)
  }

  const handleShareAccount = (e: React.MouseEvent<HTMLButtonElement>, fid: number) => {
    e.stopPropagation()
    e.preventDefault()
    setOpenShareAccountModal(true)
    setShareAccountFid(fid)
    setShareAccountUsername(supercastUserState.accounts.find((account) => account.fid === fid).username)
  }

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = async () => {
    posthog.reset()
    logout()
    setSuperCastUserState(null)
    localStorage.clear()
  }

  return (
    <div>
      <ShareAccountModal open={openShareAccountModal} setOpen={setOpenShareAccountModal} shareFid={shareAccountFid} shareUsername={shareAccountUsername} />
      <RemoveAccountModal open={openRemoveAccountModal} setOpen={setOpenRemoveAccountModal} removeFid={removeAccountFid} />
      <RemoveSharedAccountModal open={openRemoveSharedAccountModal} setOpen={setOpenRemoveSharedAccountModal} removeFid={removeSharedAccountFid} />
      <FeedHeader title="Settings" />
      <main className="px-4 sm:px-6 lg:px-8 pt-14 lg:pt-0">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none divide-y dark:divide-gray-800">
          {isRegularUser() && (
            <div className="pb-2">
              <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-gray-100">Connected accounts</h2>
              <p className="text-sm leading-6 text-gray-500">Inspect and remove connected accounts</p>

              {supercastUserState.accounts.map((account) => (
                <div
                  key={account.fid}
                  className='flex flex-col sm:flex-row sm:items-center gap-y-2 sm:gap-y-0 hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-2 group/row rounded-md w-full'
                >
                  <div className="flex flex-row items-center flex-grow">
                    <Avatar className="w-10 h-10 rounded-full mr-4 object-cover">
                      <AvatarImage
                        src={account.avatar}
                        alt='Profile picture'
                      />
                      <AvatarFallback>
                        <Skeleton
                          className="w-10 h-10"
                        />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-row items-center flex-grow min-w-0 overflow-hidden">
                      <span className="text-gray-900 dark:text-gray-100 text-sm font-semibold mr-1 truncate max-w-full">{account.displayName}</span>
                      <span className="text-gray-500 text-sm font-light truncate max-w-full">@{account.username}</span>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto sm:mr-1">
                    {account.fid === supercastUserState.userFid
                      ?
                      <div className="w-full sm:w-auto flex items-center gap-x-2">
                        <Button
                          onClick={(e) => { handleShareAccount(e, account.fid) }}
                          className="px-2 py-1 h-min w-full"
                        >
                          Share access
                        </Button>
                      </div>
                      : account.connected ?
                        <div className="flex items-center gap-x-2">
                          <Button
                            onClick={(e) => { handleShareAccount(e, account.fid) }}
                            className="px-2 py-1 h-min w-full"
                          >
                            Share access
                          </Button>
                          <Button
                            onClick={(e) => { handleRemoveAccount(e, account.fid) }}
                            variant="destructive"
                            className="px-2 py-1 h-min w-full"
                          >
                            Disconnect
                          </Button>
                        </div>
                        : account.sharedWith &&
                        <div className="flex items-center gap-x-2">
                          <p className="text-gray-500 text-xs w-full">Shared access</p>
                          <Button
                            onClick={(e) => { handleRemoveSharedAccount(e, account.fid) }}
                            variant="destructive"
                            className="px-2 py-1 h-min w-full"
                          >
                            Remove shared
                          </Button>
                        </div>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="py-4">
            <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-gray-100">Seed phrase export</h2>
            <p className="text-sm leading-6 text-gray-500">Export the seedphrase to your account.</p>

            <ul role="list" className="mt-2 text-sm leading-6">
              <li className="flex items-center justify-between gap-x-6 py-2">
                <div className="text-sm text-gray-800 dark:text-gray-100">
                </div>
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <Button
                      className="h-min flex items-center gap-x-1.5"
                      onClick={() => {
                        exportWallet()
                      }}
                    >
                      Export
                    </Button>
                  </div>
                </Menu>
              </li>
            </ul>
          </div>
          <div className="py-4">
            <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-gray-100">Appearance</h2>
            <p className="text-sm leading-6 text-gray-500">Control your user experience.</p>

            <ul role="list" className="mt-2 text-sm leading-6">
              <li className="flex items-center justify-between gap-x-6 py-2">
                <div className=" text-gray-800 dark:text-gray-100">Theme</div>
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 border dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      {theme}
                      <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                    </Menu.Button>
                  </div>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute left-0 z-10 mt-2 origin-top-right rounded-md bg-white dark:bg-gray-900 shadow-lg focus:outline-none">
                      <div className="py-1">
                        {["light", "dark", "system"].map((mode) => (
                          <Menu.Item key={mode}>
                            {({ active }) => (
                              <button
                                onClick={() => {
                                  setTheme(mode)
                                }}
                                className={classNames(
                                  active ? 'bg-gray-100 text-gray-900 dark:bg-gray-800' : 'text-gray-700 dark:bg-gray-900',
                                  'block px-4 py-2 text-sm w-full text-left dark:text-gray-100'
                                )}
                              >
                                {/* @ts-ignore */}
                                {mode}
                              </button>
                            )}
                          </Menu.Item>
                        ))}
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </li>
            </ul>
          </div>
          {isRegularUser() && (
            <div className="py-4">
              <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-gray-100">Farcaster storage</h2>

              {storageQuery.isLoading && (
                <div className="flex flex-col gap-y-2">
                  <p className="text-sm leading-6 text-gray-500">Loading...</p>
                </div>
              )}

              {storageQuery.isSuccess && (
                <div>
                  <div className="flex flex-col gap-y-2">
                    <p className="text-sm leading-6 text-gray-500">{`You currently have ${storageQuery.data.storage_units} storage unit${storageQuery.data.storage_units > 1 ? 's' : ''}`}</p>
                    <p className="text-sm leading-6 font-semibold">Your storage usage</p>
                    <div className="flex flex-row justify-between gap-x-2 text-sm text-gray-500">
                      <p className="">Casts</p>
                      <p><span className={`${storageQuery.data.casts_used >= storageQuery.data.casts_limit ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'} font-semibold`}>{storageQuery.data.casts_used}</span> / {storageQuery.data.casts_limit}</p>
                    </div>
                    <div className="flex flex-row justify-between gap-x-2 text-sm text-gray-500">
                      <p className="">Reactions</p>
                      <p><span className={`${storageQuery.data.reactions_used >= storageQuery.data.reactions_limit ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'} font-semibold`}>{storageQuery.data.reactions_used}</span> / {storageQuery.data.reactions_limit}</p>
                    </div>
                    <div className="flex flex-row justify-between gap-x-2 text-sm text-gray-500">
                      <p className="">Follows</p>
                      <p><span className={`${storageQuery.data.follows_used >= storageQuery.data.follows_limit ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'} font-semibold`}>{storageQuery.data.follows_used}</span> / {storageQuery.data.follows_limit}</p>
                    </div>

                    <Button
                      onClick={() => handlePurchaseStorage()}
                      className="w-full"
                    >
                      Buy more storage
                    </Button>
                  </div>


                </div>
              )}

            </div>
          )}
          {isRegularUser() && (
            <div className="py-4">
              <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-gray-100">Billing</h2>

              {billingQuery.isLoading && (
                <div className="flex flex-col gap-y-2">
                  <p className="text-sm leading-6 text-gray-500">Loading...</p>
                </div>
              )}

              {billingQuery.isSuccess && (
                <div>
                  <div className="flex flex-col gap-y-2">
                    <p className="text-sm leading-6 text-gray-500">{billingQuery.data.current_plan == PLAN.FREE ? "You are currently not a Castora member. Join today to enjoy all the benefits." : "Congrats! You are a Castora member. Your membership will expire on " + new Date(billingQuery.data.paid_until).toLocaleDateString()}</p>
                    <Button
                      onClick={() => handleExtendSubscription()}
                      className="w-full"
                    >
                      {billingQuery.data.current_plan == PLAN.FREE ? "Become a member" : "Extend membership"}
                    </Button>
                  </div>

                  {/* display past payments */}
                  <div className="flex flex-col gap-y-2 mt-4">
                    <p className="text-sm leading-6 font-semibold">Past payments</p>
                    {billingQuery.data.past_payments.length > 0 ? (
                      <div className="flex flex-col gap-y-2">
                        {billingQuery.data.past_payments.map((payment, index) => (
                          // each row contains the date, the name of the product, and a button to view the invoice
                          <div key={payment.product_name + index} className="flex flex-row items-center justify-between text-xs">
                            <div className="flex flex-col gap-y-1">
                              <p className="text-sm text-gray-500">{payment.product_name}</p>
                              <div className="flex flex-row items-center gap-x-1">
                                <p className="text-gray-500">${payment.usd_value}</p>
                                <p className="text-gray-500">•</p>
                                <p className="text-gray-500">{new Date(payment.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              disabled={!payment.receipt_url}
                              onClick={() => {
                                if (payment.receipt_url) {
                                  window.open(payment.receipt_url, '_blank');
                                }
                              }}
                            >
                              View {payment.payment_method === PAYMENT_METHOD.STRIPE ? 'invoice' : 'transaction'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-y-2">
                        <p className="text-sm text-gray-500">No past payments available. Check your email for invoices older than January 16th, 2025.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
          <div className="py-6 flex justify-end">
            {/* log out button */}
            <Button
              onClick={() => handleLogout()}
              className="h-min w-20"
              variant="destructive"
            >
              Log out
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
