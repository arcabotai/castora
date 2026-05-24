'use client'

import { User } from "@/types"
import CastDetailColumn from "../CastDetailColumn"
import ProfileManageList from "./ProfileManageList"
import ProfileFollowing from "./ProfileFollowing"

export default function ProfileRightColumn({ rightColumnStatus, setRightColumnStatus, profile }: { rightColumnStatus: string, setRightColumnStatus: any, profile: User }) {

  return (
    <>
      {rightColumnStatus === 'cast' && <CastDetailColumn />}
      {rightColumnStatus === 'followers' && <ProfileFollowing setRightColumnStatus={setRightColumnStatus} fid={profile?.fid} type="followers" />}
      {rightColumnStatus === 'following' && <ProfileFollowing setRightColumnStatus={setRightColumnStatus} fid={profile?.fid} type="following" />}
      {rightColumnStatus === 'relevant_follows' && <ProfileFollowing setRightColumnStatus={setRightColumnStatus} fid={profile?.fid} type="relevant_follows" />}
    </>
  )
}
