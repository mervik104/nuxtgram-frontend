import { describe, expect, test } from 'bun:test'
import { formatCompactNumber, formatSocialDate, formatWithSpaces, normalizeText } from '../app/utils/formats'
import { pluralFollowers, pluralFollowing, pluralPublications, pluralize } from '../app/utils/pluralize'

describe('normalizeText', () => {
  // Проверка: срезаются пробелы с начал/концов каждой строки.
  test('strips per-line leading/trailing whitespace', () => {
    expect(normalizeText('  hello \n  world  ')).toBe('hello\nworld')
  })

  // Проверка: 3+ переноса строк схлопываются в двойной перенос.
  test('collapses 3+ newlines into a double newline', () => {
    expect(normalizeText('a\n\n\n\n\nb')).toBe('a\n\nb')
  })

  // Проверка: многократные пробелы схлопываются и текст тримится.
  test('collapses multiple spaces and trims', () => {
    expect(normalizeText('  a   b   c  ')).toBe('a b c')
  })

  // Проверка: длинные серии табов схлопываются.
  test('collapses long tab runs', () => {
    expect(normalizeText('a\t\t\tb')).toBe('a\t\tb')
  })
})

describe('formatCompactNumber', () => {
  // Проверка: ноль остаётся нулём.
  test('zero stays zero', () => {
    expect(formatCompactNumber(0)).toBe('0')
  })

  // Проверка: числа до 999 (и отрицательные) остаются без суффикса.
  test('tier 0 stays plain', () => {
    expect(formatCompactNumber(999)).toBe('999')
    expect(formatCompactNumber(-42)).toBe('-42')
  })

  // Проверка: тысячи получают суффикс 'k' и округление до одного знака.
  test('thousands get suffix and rounding', () => {
    expect(formatCompactNumber(1234)).toBe('1.2k')
    expect(formatCompactNumber(1500)).toBe('1.5k')
    expect(formatCompactNumber(1200, 2)).toBe('1.2k')
  })

  // Проверка: миллионы и миллиарды получают M/B.
  test('millions and beyond', () => {
    expect(formatCompactNumber(1_500_000)).toBe('1.5M')
    expect(formatCompactNumber(2_000_000_000)).toBe('2B')
  })
})

describe('formatWithSpaces', () => {
  // Проверка: группировка цифр через неразрывные пробелы (ru-RU).
  test('groups with ru-RU separators (non-breaking spaces)', () => {
    expect(formatWithSpaces(1234567)).toBe(`1\u00A0234\u00A0567`)
  })
})

describe('pluralize (russian)', () => {
  // Проверка: числа 11–19 (и сходные) требуют форму множественного числа.
  test('11-19 use many', () => {
    expect(pluralize(11, 'публикация', 'публикации', 'публикаций')).toBe('публикаций')
    expect(pluralize(15, 'публикация', 'публикации', 'публикаций')).toBe('публикаций')
    expect(pluralize(111, 'публикация', 'публикации', 'публикаций')).toBe('публикаций')
  })

  // Проверка: классическое правило 1 / 2-4 / 5+ и для нуля.
  test('1 / 2-4 / 5+', () => {
    expect(pluralize(1, 'публикация', 'публикации', 'публикаций')).toBe('публикация')
    expect(pluralize(2, 'публикация', 'публикации', 'публикаций')).toBe('публикации')
    expect(pluralize(4, 'публикация', 'публикации', 'публикаций')).toBe('публикации')
    expect(pluralize(5, 'публикация', 'публикации', 'публикаций')).toBe('публикаций')
    expect(pluralize(0, 'публикация', 'публикации', 'публикаций')).toBe('публикаций')
  })

  // Проверка: числа 21, 22, 24, 25 «перезапускают» паттерн единиц.
  test('21, 22, 24, 25 reset the pattern', () => {
    expect(pluralize(21, 'публикация', 'публикации', 'публикаций')).toBe('публикация')
    expect(pluralize(22, 'публикация', 'публикации', 'публикаций')).toBe('публикации')
    expect(pluralize(25, 'публикация', 'публикации', 'публикаций')).toBe('публикаций')
  })

  // Проверка: именованные обёртки для конкретных слов (подписчиков, публикаций...).
  test('named wrappers', () => {
    expect(pluralFollowers(1)).toBe('подписчик')
    expect(pluralFollowers(5)).toBe('подписчиков')
    expect(pluralPublications(3)).toBe('публикации')
    expect(pluralFollowing(21)).toBe('подписка')
  })
})

describe('formatSocialDate', () => {
  // Проверка: свежие метки (<1 мин) показываются как «менее минуты назад».
  test('recent timestamps show minutes', () => {
    const recent = new Date(Date.now() - 30_000).toISOString()
    expect(formatSocialDate(recent)).toBe('менее минуты назад')
  })

  // Проверка: недавние таймстампы показывают минуты («5 мин назад»).
  test('minutes ago', () => {
    const recent = new Date(Date.now() - 5 * 60_000).toISOString()
    expect(formatSocialDate(recent)).toBe('5 мин назад')
  })

  // Проверка: часы («…ч назад»).
  test('hours ago', () => {
    const recent = new Date(Date.now() - 3 * 3_600_000).toISOString()
    expect(formatSocialDate(recent)).toMatch(/ч назад/)
  })

  // Проверка: дни («3 дн назад»).
  test('days ago', () => {
    const recent = new Date(Date.now() - 3 * 86_400_000).toISOString()
    expect(formatSocialDate(recent)).toBe('3 дн назад')
  })

  // Проверка: более старые даты (в пределах года) — название месяца, без «назад».
  test('older same-year falls back to a month name', () => {
    const older = new Date(Date.now() - 40 * 86_400_000).toISOString()
    const result = formatSocialDate(older)
    expect(result).not.toMatch(/назад/)
    expect(result.length).toBeGreaterThan(0)
  })
})