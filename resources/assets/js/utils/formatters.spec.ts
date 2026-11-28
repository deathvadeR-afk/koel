import { describe, expect, it } from 'vite-plus/test'
import type { ServerValidationError } from './formatters'
import {
  br2nl,
  formatBytes,
  normalizeForComparison,
  parseValidationError,
  pluralize,
  secondsToClock,
  secondsToHis,
  secondsToHumanReadable,
  slugToTitle,
} from './formatters'

describe('formatters utils', () => {
  it.each([
    [0, '00:00'],
    [59, '00:59'],
    [60, '01:00'],
    [125, '02:05'],
    [7547, '02:05:47'],
    [137241, '38:07:21'],
  ])('formats %d seconds to H:i:s', (seconds, formatted) => expect(secondsToHis(seconds)).toBe(formatted))

  it.each([
    [0, '0 sec'],
    [59, '59 sec'],
    [60, '1 min'],
    [125, '2 min 5 sec'],
    [7547, '2 hr 5 min'],
    [137241, '38 hr 7 min'],
  ])('formats %d seconds to human readable', (seconds, formatted) => {
    expect(secondsToHumanReadable(seconds)).toBe(formatted)
  })

  it('[QP-SMLARGE-6-1] Shows a length under one hour as minutes and two-digit seconds', () => {
    expect(secondsToClock(185)).toBe('3:05')
  })

  it('[QP-SMLARGE-6-2] Shows a single-digit minute count without padding when seconds are 59', () => {
    expect(secondsToClock(59)).toBe('0:59')
  })

  it('[QP-SMLARGE-6-3] Shows 3599 seconds as 59:59, the last length under one hour', () => {
    expect(secondsToClock(3599)).toBe('59:59')
  })

  it('[QP-SMLARGE-6-4] Shows a length over one hour as hours, two-digit minutes and two-digit seconds', () => {
    expect(secondsToClock(3725)).toBe('1:02:05')
  })

  it('[QP-SMLARGE-6-5] Shows exactly one hour as 1:00:00', () => {
    expect(secondsToClock(3600)).toBe('1:00:00')
  })

  it('[QP-SMLARGE-6-6] Drops the fraction of a second instead of rounding it', () => {
    expect(secondsToClock(185.7)).toBe('3:05')
  })

  it('[QP-SMLARGE-6-7] Shows a negative length as 0:00', () => {
    expect(secondsToClock(-5)).toBe('0:00')
  })

  it('[QP-SMLARGE-6-8] Shows a missing length as 0:00', () => {
    expect(secondsToClock()).toBe('0:00')
  })

  it('[QP-SMLARGE-6-9] Shows a length of zero as 0:00', () => {
    expect(secondsToClock(0)).toBe('0:00')
  })

  it('parses validation error', () => {
    const error: ServerValidationError = {
      message: 'The given data was invalid',
      errors: {
        email: ['The email has already been taken', 'The domain is blacklisted'],
        name: ['The name is required'],
      },
    }

    expect(parseValidationError(error)).toEqual([
      'The email has already been taken',
      'The domain is blacklisted',
      'The name is required',
    ])
  })

  it.each([
    ['foo<br>bar', 'foo\nbar'],
    ['foo<br/>bar', 'foo\nbar'],
    ['foo<br />bar', 'foo\nbar'],
    ['foo<br>bar<br/>baz', 'foo\nbar\nbaz'],
  ])('converts <br> tags in %s to line breaks', (input, output) => expect(br2nl(input)).toEqual(output))

  it.each([
    ['foo', 'Foo'],
    ['foo-bar', 'Foo Bar'],
    ['foo-bar--baz', 'Foo Bar Baz'],
    ['foo-bar--baz---', 'Foo Bar Baz'],
  ])('converts %s to the title counterpart', (slug, title) => expect(slugToTitle(slug)).toEqual(title))

  it.each([
    [1, 'cat', 'cat'],
    [2, 'cat', 'cats'],
    [0, 'cat', 'cats'],
  ])('pluralizes %d %s', (count, noun, plural) => expect(pluralize(count, noun)).toEqual(`${count} ${plural}`))

  it.each([
    [['foo'], 'cat', 'cat'],
    [['foo', 'bar'], 'cat', 'cats'],
    [[], 'cat', 'cats'],
  ])('pluralizes with array parameters', (arr, noun, plural) =>
    expect(pluralize(arr, noun)).toEqual(`${arr.length} ${plural}`),
  )

  it.each([
    [0, '0 B'],
    [512, '512 B'],
    [1024, '1 KB'],
    [1536, '1.5 KB'],
    [1048576, '1 MB'],
    [1073741824, '1 GB'],
    [524288000, '500 MB'],
    [250 * 1024 ** 3, '250 GB'],
    [1024 ** 4, '1 TB'],
    [1.5 * 1024 ** 4, '1.5 TB'],
    [1024 ** 6, '1024 PB'],
  ])('formats %d bytes', (bytes, formatted) => expect(formatBytes(bytes)).toBe(formatted))

  it.each<[string, string]>([
    ['Hello World', 'hello world'],
    ['AN AMAZING SONG', 'an amazing song'],
    ['Xin chào Việt Nam', 'xin chao viet nam'],
    ['Über den Wölken', 'uber den wolken'],
    ['Café 你好', 'cafe 你好'],
    ['你好世界', '你好世界'],
    ['こんにちは世界', 'こんにちは世界'],
    ['안녕하세요 세계', '안녕하세요 세계'.normalize('NFKD')],
    ['مرحبا بالعالم', 'مرحبا بالعالم'],
    ['Hello, World!', 'hello world'],
    ['Fade - To Black', 'fade to black'],
    ['Song Title (Remastered)', 'song title remastered'],
    ['Song Title [Live]', 'song title live'],
    ['Mr. Brightside', 'mr brightside'],
    ["Don't Stop Me Now", 'dont stop me now'],
    ['Hello   World', 'hello world'],
  ])('normalizes "%s" for comparison', (input, expected) => {
    expect(normalizeForComparison(input)).toBe(expected)
  })
})
