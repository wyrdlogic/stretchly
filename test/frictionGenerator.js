import { describe, it, expect } from 'vitest'
import { generateRandomString, generateFrictionStrings } from '../app/utils/frictionGenerator.js'

describe('generateRandomString', () => {
  it('should generate string of correct length', () => {
    const str = generateRandomString(20)
    expect(str).toHaveLength(20)
  })

  it('should generate string with all character classes', () => {
    const str = generateRandomString(20)
    expect(str).toMatch(/[0-9]/) // numbers
    expect(str).toMatch(/[a-z]/) // lowercase
    expect(str).toMatch(/[A-Z]/) // uppercase
    expect(str).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/) // special
  })

  it('should generate unique strings across calls', () => {
    const str1 = generateRandomString(20)
    const str2 = generateRandomString(20)
    expect(str1).not.toBe(str2)
  })

  it('should handle edge case length=1', () => {
    const str = generateRandomString(1)
    expect(str).toHaveLength(1)
  })

  it('should handle edge case length=50', () => {
    const str = generateRandomString(50)
    expect(str).toHaveLength(50)
  })

  it('should throw error for length < 1', () => {
    expect(() => generateRandomString(0)).toThrow('String length must be between 1 and 50')
  })

  it('should throw error for length > 50', () => {
    expect(() => generateRandomString(51)).toThrow('String length must be between 1 and 50')
  })

  it('should distribute characters balanced across classes', () => {
    const str = generateRandomString(20)
    const numbers = (str.match(/[0-9]/g) || []).length
    const lowercase = (str.match(/[a-z]/g) || []).length
    const uppercase = (str.match(/[A-Z]/g) || []).length
    const special = (str.match(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/g) || []).length

    expect(numbers + lowercase + uppercase + special).toBe(20)
    expect(numbers).toBeGreaterThanOrEqual(4)
    expect(lowercase).toBeGreaterThanOrEqual(4)
    expect(uppercase).toBeGreaterThanOrEqual(4)
    expect(special).toBeGreaterThanOrEqual(4)
  })
})

describe('generateFrictionStrings', () => {
  it('should return single string when incremental disabled', () => {
    const words = generateFrictionStrings(20, 5, 5, false)
    expect(words).toHaveLength(1)
    expect(words[0]).toHaveLength(20)
  })

  it('should return correct word count with incremental enabled', () => {
    const words = generateFrictionStrings(20, 2, 5, true)
    expect(words).toHaveLength(3) // 1 + sequentialCount
  })

  it('should cap word count at maxWords', () => {
    const words = generateFrictionStrings(20, 10, 5, true)
    expect(words).toHaveLength(5) // capped at maxWords
  })

  it('should return 1 word for sequentialCount=0', () => {
    const words = generateFrictionStrings(20, 0, 5, true)
    expect(words).toHaveLength(1)
  })

  it('should return unique strings for each word', () => {
    const words = generateFrictionStrings(20, 2, 5, true)
    expect(words[0]).not.toBe(words[1])
    expect(words[1]).not.toBe(words[2])
  })

  it('should respect charLength for all words', () => {
    const words = generateFrictionStrings(15, 2, 5, true)
    words.forEach(word => {
      expect(word).toHaveLength(15)
    })
  })

  it('should handle maxWords boundary correctly', () => {
    const words1 = generateFrictionStrings(20, 4, 5, true)
    expect(words1).toHaveLength(5) // 1 + 4 = 5

    const words2 = generateFrictionStrings(20, 5, 5, true)
    expect(words2).toHaveLength(5) // min(1 + 5, 5) = 5
  })
})
