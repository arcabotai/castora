import { prisma } from '@/prisma/client'
import { PaymentSession, PLAN, PRODUCT_TYPE } from '@prisma/client'
import axios from 'axios'
import { memberOnboarding } from './members'
import { trackPosthogEvent } from './posthogAnalytics'
import { redis } from '@/utils/redis'


const handleSuccessfulPayment = async (paymentSession: PaymentSession) => {

  const supercastPrivyUser = await prisma.supercastPrivyUser.findFirst({
    where: {
      id: paymentSession.supercastPrivyUserId,
    },
  })

  trackPosthogEvent(supercastPrivyUser.fid, "payment_received", {
    product_type: paymentSession.productType,
    product_quantity: paymentSession.productQuantity,
    payment_amount: paymentSession.usdValue,
    payment_method: paymentSession.paymentMethod,
  })

  if (paymentSession.productType === PRODUCT_TYPE.MEMBERSHIP) {
    console.log('handleSuccessfulPayment: MEMBERSHIP')

    const monthsPaidFor = paymentSession.productQuantity
    const millisecondsInMonth = 31 * 24 * 60 * 60 * 1000

    // if current paidUntil is in the past, set it to today
    const currentPaidUntil = supercastPrivyUser.paidUntil < new Date() ? new Date() : supercastPrivyUser.paidUntil

    const newPaidUntil = new Date(currentPaidUntil.getTime() + monthsPaidFor * millisecondsInMonth)

    const updatedSupercastPrivyUser = await prisma.supercastPrivyUser.update({
      where: {
        id: supercastPrivyUser.id,
      },
      data: {
        plan: PLAN.PERSONAL,
        paidUntil: newPaidUntil,
      },
    })

    const cacheKey = 'leaderboard:membership'
    await redis.del(cacheKey)

    trackPosthogEvent(supercastPrivyUser.fid, "membership_purchased", {
      productQuantity: paymentSession.productQuantity,
    })

    if (supercastPrivyUser.plan === PLAN.FREE && updatedSupercastPrivyUser.plan === PLAN.PERSONAL) {
      memberOnboarding(supercastPrivyUser.fid)
    }
  }

  if (paymentSession.productType === PRODUCT_TYPE.REGISTRATION) {
    console.log('handleSuccessfulPayment: REGISTRATION')

    const updatedSupercastPrivyUser = await prisma.supercastPrivyUser.update({
      where: {
        id: paymentSession.supercastPrivyUserId,
      },
      data: {
        registrationPaidFor: true,
      },
    })

    trackPosthogEvent(supercastPrivyUser.fid, "registration_purchased", {
      productQuantity: paymentSession.productQuantity,
    })
  }

  if (paymentSession.productType === PRODUCT_TYPE.STORAGE) {
    console.log('handleSuccessfulPayment: STORAGE')

    const supercastUser = await prisma.supercastPrivyUser.findUnique({
      where: {
        id: paymentSession.supercastPrivyUserId,
      },
    })

    const neynarData = {
      "fid": supercastUser.fid,
      "units": paymentSession.productQuantity,
      "idem": paymentSession.id
    }

    axios.post(`https://api.neynar.com/v2/farcaster/storage/buy/`, neynarData, { "headers": { "x-api-key": process.env.NEYNAR_API_KEY } })
      .then((response) => {
        console.log("neynarStorageResponse", response)
      })
      .catch((error) => {
        console.error("Error purchasing storage", error)
      })

    trackPosthogEvent(supercastPrivyUser.fid, "storage_purchased", {
      productQuantity: paymentSession.productQuantity,
    })
  }
}

export { handleSuccessfulPayment }
