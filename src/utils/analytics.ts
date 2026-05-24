import { prisma } from '@/prisma/client'
import { EVENT_TYPE } from '@prisma/client'

export const trackEvent = (eventType: EVENT_TYPE, fid: number) => {

  prisma.analyticsEvent.create({
    data: {
      event_type: eventType,
      userFid: fid,
    }
  }).catch((err) => console.log(err))
}