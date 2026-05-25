import { useState } from 'react'
import { StarIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import { HOST_URL } from '@/utils/hostURL'
import { usePrivy } from '@privy-io/react-auth';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';

const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true';

const PremiumOnlyPaywall: React.FC = () => {

  const [checkoutLoadingMonthly, setCheckoutLoadingMonthly] = useState(false)
  const [checkoutLoadingYearly, setCheckoutLoadingYearly] = useState(false)
  const { supercastUserState } = useSupercastUserState()
  const { getAccessToken } = usePrivy()

  const handleGoToCheckout = async (period: "monthly" | "yearly") => {
    if (!PAYMENTS_ENABLED) return;

    const accessToken = await getAccessToken()

    if (period === "monthly") {
      setCheckoutLoadingMonthly(true)
    } else {
      setCheckoutLoadingYearly(true)
    }
    axios.post(`${HOST_URL}/api/stripe/create-checkout`, {
      period
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'asFid': supercastUserState.currentFid,
      }
    }).then((res) => {
      window.location.href = res.data.url
    })
      .finally(() => {
        setCheckoutLoadingMonthly(false)
        setCheckoutLoadingYearly(false)
      })
  }

  return (
    <div className='flex flex-row justify-center'>
      <div className='flex flex-row justify-center pt-12 max-w-[400px]'>
        <div className='flex flex-col dark:text-gray-200 border dark:border-gray-700 rounded-md px-6 py-3'>
          <p className='mb-4 text-4xl font-semibold'>Castora</p>
          <p className='text-sm mb-3'>This inherited premium screen is disabled for the Castora beta.</p>
          <p className='text-sm mb-3'>Core beta features are focused on Farcaster login, signer connection, posting, and reading.</p>
          <ul className='flex flex-col gap-y-2 mb-6'>
            <li className='flex flex-row items-center gap-x-2 text-sm'>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100">
                <StarIcon className="h-4 w-4 text-yellow-500" aria-hidden="true" />
              </div>
              using multiple accounts
            </li>
            <li className='flex flex-row items-center gap-x-2 text-sm'>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100">
                <StarIcon className="h-4 w-4 text-yellow-500" aria-hidden="true" />
              </div>
              scheduling casts
            </li>
            <li className='flex flex-row items-center gap-x-2 text-sm'>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100">
                <StarIcon className="h-4 w-4 text-yellow-500" aria-hidden="true" />
              </div>
              creating threads, polls, lists and bookmarks
            </li>
            <li className='flex flex-row items-center gap-x-2 text-sm'>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100">
                <StarIcon className="h-4 w-4 text-yellow-500" aria-hidden="true" />
              </div>
              an exclusive poweruser telegram group
            </li>
          </ul>
          <button
            type="button"
            className="flex flex-row items-center w-full justify-center rounded-md bg-white border border-black dark:border-gray-700 dark:bg-gray-900 mb-1 px-3 py-2 text-sm font-semibold text-black dark:text-gray-100 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => handleGoToCheckout("monthly")}
            disabled={!PAYMENTS_ENABLED || checkoutLoadingMonthly || checkoutLoadingYearly}
          >
            {checkoutLoadingMonthly
              &&
              <div role="status" className='flex flex-row justify-center mr-2'>
                <svg aria-hidden="true" className="w-4 h-4 mx-auto text-gray-200 dark:text-gray-900 animate-spin fill-gray-900 dark:fill-gray-200" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            }
            {PAYMENTS_ENABLED ? '$10/mo · Checkout monthly' : 'Payments disabled for beta'}
          </button>
          <button
            type="button"
            className="flex flex-row items-center w-full justify-center rounded-md bg-gray-900 dark:bg-gray-200 px-3 py-2 text-sm font-semibold text-white dark:text-gray-900 shadow-sm hover:bg-gray-800 dark:hover:bg-gray-300"
            onClick={() => handleGoToCheckout("yearly")}
            disabled={!PAYMENTS_ENABLED || checkoutLoadingMonthly || checkoutLoadingYearly}
          >
            {checkoutLoadingYearly
              &&
              <div role="status" className='flex flex-row justify-center mr-2'>
                <svg aria-hidden="true" className="w-4 h-4 mx-auto text-gray-200 dark:text-gray-900 animate-spin fill-gray-900 dark:fill-gray-200" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            }
            {PAYMENTS_ENABLED ? '$100/yr · Checkout yearly' : 'Beta access only'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumOnlyPaywall;
