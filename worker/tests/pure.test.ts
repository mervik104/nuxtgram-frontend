import { describe, expect, test } from 'bun:test'
import {
  baseNickname,
  cleanFilename,
  isSupportedImageType,
  ownerPrefixFor,
  publicObjectUrl,
  userObjectKey,
  validObjectKey,
} from '../src/pure'

describe('cleanFilename', () => {
  test('keeps safe basenames', () => {
    expect(cleanFilename('photo.png')).toBe('photo.png')
    expect(cleanFilename('my photo (1).jpeg')).toBe('my-photo--1-.jpeg')
  })

  test('strips directory traversal parts', () => {
    expect(cleanFilename('../../etc/passwd')).toBe('passwd')
    expect(cleanFilename('/a/../b.jpg')).toBe('b.jpg')
  })

  test('neutralizes double dots', () => {
    expect(cleanFilename('a..b.png')).toBe('a-b.png')
  })

  test('truncates to 120 chars', () => {
    const long = 'x'.repeat(500) + '.png'
    const result = cleanFilename(long)
    expect(result.length).toBe(120)
  })

  test('falls back for empty names', () => {
    expect(cleanFilename('')).toBe('upload')
    expect(cleanFilename('///')).toBe('upload')
  })
})

describe('validObjectKey', () => {
  test('accepts media-prefixed keys', () => {
    expect(validObjectKey('media/user_1/abc-123.png')).toBe(true)
  })

  test('rejects traversal and non-media keys', () => {
    expect(validObjectKey('../media/x.png')).toBe(false)
    expect(validObjectKey('media/../x.png')).toBe(false)
    expect(validObjectKey('media/a/..\\b.png')).toBe(false)
    expect(validObjectKey('uploads/x.png')).toBe(false)
    expect(validObjectKey('')).toBe(false)
  })
})

describe('ownerPrefixFor', () => {
  test('scopes keys under media/<encoded clerk id>/', () => {
    expect(ownerPrefixFor('user_abc')).toBe('media/user_abc/')
    expect(ownerPrefixFor('a b/')).toBe('media/a%20b%2F/')
  })
})

describe('userObjectKey', () => {
  test('builds unique key in the owner namespace', () => {
    const a = userObjectKey('user_1', 'x.png')
    const b = userObjectKey('user_1', 'x.png')
    expect(a.startsWith('media/user_1/')).toBe(true)
    expect(a.endsWith('-x.png')).toBe(true)
    expect(a).not.toBe(b)
  })
})

describe('publicObjectUrl', () => {
  test('joins base and encoded key, trimming trailing slash', () => {
    expect(publicObjectUrl('https://cdn.example.com/', 'media/u/a b.png')).toBe(
      'https://cdn.example.com/media/u/a%20b.png',
    )
  })
})

describe('baseNickname', () => {
  test('lowercases, strips whitespace, caps at 10 chars', () => {
    expect(baseNickname('Boris St')).toBe('borisst')
    expect(baseNickname(' A B '.repeat(5))).toBe('ababababab')
  })
})

describe('isSupportedImageType', () => {
  test('accepts raster image types', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif', 'image/bmp']) {
      expect(isSupportedImageType(type)).toBe(true)
    }
  })

  test('accepts case/space variants', () => {
    expect(isSupportedImageType('  IMAGE/PNG ')).toBe(true)
  })

  test('rejects svg, xml, and non-images', () => {
    for (const type of ['image/svg+xml', 'image/xml', 'text/html', 'application/pdf', 'video/mp4', '']) {
      expect(isSupportedImageType(type)).toBe(false)
    }
  })
})