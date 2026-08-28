import { useAuthStore } from '~/stores/auth'
import { useCommentStore } from '~/stores/comment'
import { useFollowsStore } from '~/stores/follows'
import { usePostStore } from '~/stores/post'
import { useSurrealDb } from '~/data/surreal/useSurrealDb'
import { log } from '~/utils/logger'

// Полный сброс клиентского состояния при logout или смене пользователя:
// чистит кэши постов/комментариев/подписок, закрывает модалки, сбрасывает юзера
// и гасит SurrealDB-подключение (чтобы чужая сессия не отслеживалась).
export async function resetAppState() {
  const authStore = useAuthStore()
  const postStore = usePostStore()
  const commentStore = useCommentStore()
  const followsStore = useFollowsStore()

  postStore.posts = {}
  postStore.feeds = {}
  postStore.isCreateModalOpen = false
  postStore.isEditModalOpen = false
  postStore.isEditingPost = null

  commentStore.comments = {}
  commentStore.feeds = {}

  followsStore.follows = {}

  authStore.clearUser()

  await useSurrealDb().close()
  log('auth', 'состояние приложения сброшено (logout / смена пользователя)')
}