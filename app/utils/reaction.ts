// Ключевые типы реакций (набор совпадает со значением `type` в SurrealDB).
export type ReactionType = 'like' | 'love' | 'fire' | 'haha'

// Реакционное состояние: моя реакция + счётчики по каждому типу.
export interface ReactionState {
  myReaction: ReactionType | null
  reactionsCount: Record<ReactionType, number>
}

// Нулевой счётчик реакций (все типы по 0).
export const EMPTY_REACTIONS: Record<ReactionType, number> = {
  like: 0,
  love: 0,
  fire: 0,
  haha: 0,
}

// Снимок состояния реакций (счётчики копируются — мутации не заденут оригинал).
export function snapshotReaction(state: ReactionState): ReactionState {
  return {
    myReaction: state.myReaction,
    reactionsCount: { ...state.reactionsCount },
  }
}

// «Перещёлкивает» реакцию: если уже стоит — убирает (де-инкремент),
// если пусто — ставит указанный тип (инкремент). Возвращает новое состояние.
export function flipReaction(state: ReactionState, type: ReactionType): ReactionState {
  const reactionsCount = { ...state.reactionsCount }
  let myReaction: ReactionType | null = state.myReaction

  if (myReaction) {
    reactionsCount[myReaction] = Math.max(0, (reactionsCount[myReaction] || 0) - 1)
    myReaction = null
  } else {
    reactionsCount[type] = (reactionsCount[type] || 0) + 1
    myReaction = type
  }

  return { myReaction, reactionsCount }
}