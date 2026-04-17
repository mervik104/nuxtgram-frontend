export function formatSocialDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()

    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHours = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSec < 60) {
        return 'менее минуты назад'
    }

    if (diffMin < 60) {
        return `${diffMin} мин назад`
    }

    if (diffHours < 24) {
        return `${diffHours} ч назад`
    }

    if (isToday(date)) {
        return `сегодня в ${formatTime(date)}`
    }

    if (isYesterday(date)) {
        return `вчера в ${formatTime(date)}`
    }

    if (diffDays < 7) {
        return `${diffDays} дн назад`
    }

    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
        })
    }

    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

function isToday(date: Date): boolean {
    const now = new Date()
    return date.toDateString() === now.toDateString()
}

function isYesterday(date: Date): boolean {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    return date.toDateString() === yesterday.toDateString()
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function normalizeText(text: string) {
  return text
    .replace(/^[ \t]+/gm, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .replace(/\t{3,}/g, '\t\t')
    .trim()
}

export function formatCompactNumber(num: number, maxDecimals: number = 1): string {
  if (num === 0) return '0';

  const suffixes = ['', 'k', 'M', 'B', 'T'];
  let tier = 0;

  while (Math.abs(num) >= 1000 && tier < suffixes.length - 1) {
    num /= 1000;
    tier++;
  }

  if (tier === 0) {
    return num.toString();
  }

  const formattedNum = parseFloat(num.toFixed(maxDecimals));
  return `${formattedNum}${suffixes[tier]}`;
}

export function formatWithSpaces(num: number): string {
  return new Intl.NumberFormat('ru-RU', {
    useGrouping: true,
  }).format(num);
}

