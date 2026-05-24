'use client'

import FollowNotification from "./FollowNotification"
import LikeNotification from "./LikeNotification"
import RecastNotification from "./RecastNotification"
import ReplyNotification from "./ReplyNotification"
import MentionNotification from "./MentionNotification"
import QuoteNotification from "./QuoteNotification"

export default function GeneralNotification({ notification, isSelected = false }: { notification: any, isSelected?: boolean }) {

  return (
    <div
      className="px-4 sm:px-6 lg:px-8 sm:hover:bg-gray-50 sm:dark:hover:bg-gray-800 hover:cursor-pointer border-b dark:border-gray-800"
    >
      {/* v2 endpoint */}
      {notification.type === 'likes' && <LikeNotification notification={notification} />}
      {notification.type === 'recasts' && <RecastNotification notification={notification} />}
      {notification.type === 'follows' && <FollowNotification notification={notification} />}
      {notification.type === 'reply' && <ReplyNotification notification={notification} isSelected={isSelected} />}
      {notification.type === 'mention' && <MentionNotification notification={notification} isSelected={isSelected} />}
      {notification.type === 'quote' && <QuoteNotification notification={notification} isSelected={isSelected} />}
    </div>
  )
}
