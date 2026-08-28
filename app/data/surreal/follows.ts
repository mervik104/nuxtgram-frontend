import { count } from 'surqlize'
import type { FollowsResponse } from '~/types/follows.types'
import { hydrateUserAvatar } from './avatars'
import type { NuxtgramDatabase } from './client'
import type { UserRow } from './schema'
import { toUser } from './mappers'
import { recordIdFromString } from './ids'

// Запись ребра follows после fetch('in'/'out'): конечные юзеры уже полные строки.
type FetchedFollowEdge = {
  id: string
  in: UserRow
  out: UserRow
}

// Подписчики, подписки и их счётчики для профиля пользователя targetId.
// Если передан currentUserId — дополнительно считает isFollowing
// (подписан ли текущий юзер на targetId). Аватары гидратируются пачкой.
export async function findUserFollows(
  db: NuxtgramDatabase,
  targetId: string,
  currentUserId?: string,
): Promise<FollowsResponse> {
  const target = recordIdFromString<'users'>(targetId)

  const [followersCountRows, followingCountRows] = await Promise.all([
    db.select('follows').where((follow) => follow.out.eq(target)).groupAll().return((follow) => ({ total: count(follow) })),
    db.select('follows').where((follow) => follow.in.eq(target)).groupAll().return((follow) => ({ total: count(follow) })),
  ])

  const [followerEdges, followingEdges] = await Promise.all([
    db.select('follows').where((follow) => follow.out.eq(target)).fetch('in'),
    db.select('follows').where((follow) => follow.in.eq(target)).fetch('out'),
  ])

  // both fetched edges carry RecordId-avatars → hydrate so cards render them.
// (old code used fetch('in','in.avatar') which made surqlize crash)
  const followers = followerEdges as unknown as FetchedFollowEdge[]
  const following = followingEdges as unknown as FetchedFollowEdge[]
  await hydrateUserAvatar(db, [...followers.map((edge) => edge.in), ...following.map((edge) => edge.out)])

  let isFollowing = false
  if (currentUserId) {
    const existing = (await db
      .select('follows')
      .where((follow) => follow.in.eq(recordIdFromString<'users'>(currentUserId)).and(follow.out.eq(target)))
      .limit(1))[0]
    isFollowing = Boolean(existing)
  }

  return {
    followersCount: Number((followersCountRows[0] as { total?: number } | undefined)?.total || 0),
    followingCount: Number((followingCountRows[0] as { total?: number } | undefined)?.total || 0),
    followers: followers.map((edge) => toUser(edge.in)),
    following: following.map((edge) => toUser(edge.out)),
    isFollowing,
  }
}

// Оформляет подписку userId → targetId (идемпотентно).
// Если подписка уже существует — бросает Error('Already following').
export async function followUser(
  db: NuxtgramDatabase,
  userId: string,
  targetId: string,
): Promise<void> {
  const user = recordIdFromString<'users'>(userId)
  const target = recordIdFromString<'users'>(targetId)

  const existing = (await db
    .select('follows')
    .where((follow) => follow.in.eq(user).and(follow.out.eq(target)))
    .limit(1))[0]
  if (existing) throw new Error('Already following')

  await db.relate('follows', user, target).return('after')
}

// Отменяет подписку userId → targetId.
// Если подписки нет — бросает Error('Not following').
export async function unfollowUser(
  db: NuxtgramDatabase,
  userId: string,
  targetId: string,
): Promise<void> {
  const user = recordIdFromString<'users'>(userId)
  const target = recordIdFromString<'users'>(targetId)

  const existing = (await db
    .select('follows')
    .where((follow) => follow.in.eq(user).and(follow.out.eq(target)))
    .limit(1))[0]
  if (!existing) throw new Error('Not following')

  await db.delete(existing.id).return('none')
}