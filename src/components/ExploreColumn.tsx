'use client'

import { useSupercastUserState } from "@/providers/SupercastUserStateProvider"
import { usePrivy } from "@privy-io/react-auth"
import SearchBar from "./search/SearchBar"
import Link from "next/link"
import EcosystemCarousel from "./ecosystem/EcosystemCarousel"
import { Button } from "./ui/button"
import { StarIcon } from "@heroicons/react/24/solid"
import { useRouter } from "next/navigation"
import { useCheckoutDialog } from "@/hooks/useCheckoutDialog"
import { PRODUCT_TYPE } from "@prisma/client"
import { ChevronRight } from "lucide-react"

const SUPERANON_FID = Number(process.env.NEXT_PUBLIC_SUPERANON_FID)
const SHOW_LEGACY_SUPERCAST_FEATURES = process.env.NEXT_PUBLIC_SHOW_LEGACY_SUPERCAST_FEATURES === "true"

export default function ExploreColumn() {
  const router = useRouter()

  const { isGuest, isRegularUser, isSuperMember, switchAccount } = useSupercastUserState()

  const { openCheckout } = useCheckoutDialog()

  const handleBecomeMember = () => {
    openCheckout(PRODUCT_TYPE.MEMBERSHIP)
  }

  const handlePostOnSuperanon = () => {
    switchAccount(SUPERANON_FID)
  }

  return (
    <div className='px-6 py-4 top-0 flex flex-col min-h-screen max-w-[400px]'>
      <div className="flex flex-col gap-y-4">
        <div className="hidden lg:block">
          <SearchBar />
        </div>

        {(isGuest()) &&
          <div className="flex flex-col gap-y-2 py-2 px-4 focus:outline-none dark:border-gray-700 rounded-xl border">
            <div className="text-sm font-semibold">Complete onboarding</div>
            <div className="text-xs text-gray-500">Connect or create a farcaster account to post, react and follow others</div>
            <Link href={`/onboarding`}>
              <Button
                className="w-full my-2">
                Create profile
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            </Link>
          </div>
        }
        {(SHOW_LEGACY_SUPERCAST_FEATURES && isRegularUser() && !isSuperMember()) &&
          <div className="flex flex-col gap-y-2 py-2 px-4 focus:outline-none dark:border-gray-700 rounded-xl border">
            <div className="text-sm font-semibold">Become a super member</div>
            <div className="text-xs text-gray-500">Get access to our community, @superanon, qualify for our $DEGEN rewards and for the future airdrops</div>
            <Button
              onClick={handleBecomeMember}
              className="w-full my-2">
              Become a member
              <StarIcon className="h-4 w-4 ml-1 text-yellow-500" />
            </Button>
          </div>
        }

        {(SHOW_LEGACY_SUPERCAST_FEATURES && isSuperMember()) &&
          <div className="flex flex-col gap-y-4">
            <div className="flex flex-col gap-y-2 py-2 px-4 focus:outline-none dark:border-gray-700 rounded-xl border">
              <div className="text-sm font-semibold">Post in super channel</div>
              <div className="text-xs text-gray-500">Post in /super to qualify for our daily 10k $DEGEN rewards</div>
              <Link href={`/channel/super`}>
                <Button
                  className="w-full my-2"
                  variant="secondary"
                >
                  Go to super channel
                  <ChevronRight className="h-5 w-5 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="flex flex-col gap-y-2 py-2 px-4 focus:outline-none dark:border-gray-700 rounded-xl border">
              <div className="text-sm font-semibold">Post on superanon</div>
              <div className="text-xs text-gray-500">Post on our community account to climb the leaderboard and win the weekly 20k $DEGEN rewards</div>
              <Button
                className="w-full my-2"
                variant="secondary"
                onClick={handlePostOnSuperanon}
              >
                Post on superanon
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            </div>
          </div>
        }

        <div className="text-xs text-gray-500 flex flex-row gap-x-2">
          <Link href={`/blog`} className="hover:underline" target="_blank">Blog</Link>
          <Link href={`/legal/terms-of-service`} className="hover:underline" target="_blank">Terms</Link>
          <Link href={`/legal/privacy-policy`} className="hover:underline" target="_blank">Privacy</Link>
          <Link href={`https://arcabot.ai`} className="hover:underline" target="_blank">Arca</Link>
        </div>
      </div >
    </div >
  )
}
