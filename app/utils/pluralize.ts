export function pluralize(
    count: number,
    one: string,
    few: string,
    many: string
): string {
    const abs = Math.abs(count) % 100
    const mod10 = abs % 10

    if (abs >= 11 && abs <= 19) return many
    if (mod10 === 1) return one
    if (mod10 >= 2 && mod10 <= 4) return few
    return many
}

export const pluralFollowers = (n: number) => pluralize(n, 'подписчик', 'подписчика', 'подписчиков')
export const pluralPublications = (n: number) => pluralize(n, 'публикация', 'публикации', 'публикаций')
export const pluralFollowing = (n: number) => pluralize(n, 'подписка', 'подписки', 'подписок')