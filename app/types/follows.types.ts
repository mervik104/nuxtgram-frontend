import type { IUser } from "./user.types"

export interface FollowsResponse {
    followersCount: number
    followingCount: number
    followers: IUser[]
    following: IUser[]
    isFollowing: boolean
}

export interface FollowType {
    follow: {
        createdAt: string
        follower: IUser
        following: IUser
        id: string
    }
    message: "Followed"
}

export interface UnfollowType {
    message: "Unfollowed"
}