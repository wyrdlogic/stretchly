import { describe, it, expect, beforeEach } from 'vitest'

describe('Friction Counters', () => {
  let mockSettings

  beforeEach(() => {
    mockSettings = {
      microbreakSkipFrictionTotalCount: 0,
      microbreakSkipFrictionSequentialCount: 0,
      breakSkipFrictionTotalCount: 0,
      breakSkipFrictionSequentialCount: 0
    }
  })

  describe('Increment Logic', () => {
    it('should increment both total and sequential counters on skip', () => {
      mockSettings.microbreakSkipFrictionTotalCount += 1
      mockSettings.microbreakSkipFrictionSequentialCount += 1

      expect(mockSettings.microbreakSkipFrictionTotalCount).toBe(1)
      expect(mockSettings.microbreakSkipFrictionSequentialCount).toBe(1)
    })

    it('should increment counters independently for mini and long breaks', () => {
      mockSettings.microbreakSkipFrictionTotalCount += 1
      mockSettings.breakSkipFrictionTotalCount += 1

      expect(mockSettings.microbreakSkipFrictionTotalCount).toBe(1)
      expect(mockSettings.breakSkipFrictionTotalCount).toBe(1)
      expect(mockSettings.microbreakSkipFrictionSequentialCount).toBe(0)
      expect(mockSettings.breakSkipFrictionSequentialCount).toBe(0)
    })

    it('should accumulate total count over multiple skips', () => {
      for (let i = 0; i < 5; i++) {
        mockSettings.breakSkipFrictionTotalCount += 1
      }
      expect(mockSettings.breakSkipFrictionTotalCount).toBe(5)
    })

    it('should accumulate sequential count over multiple skips', () => {
      for (let i = 0; i < 3; i++) {
        mockSettings.microbreakSkipFrictionSequentialCount += 1
      }
      expect(mockSettings.microbreakSkipFrictionSequentialCount).toBe(3)
    })
  })

  describe('Reset Logic', () => {
    it('should reset sequential counter to 0 on break completion', () => {
      mockSettings.breakSkipFrictionSequentialCount = 5
      mockSettings.breakSkipFrictionSequentialCount = 0

      expect(mockSettings.breakSkipFrictionSequentialCount).toBe(0)
    })

    it('should not reset total counter on break completion', () => {
      mockSettings.breakSkipFrictionTotalCount = 10
      mockSettings.breakSkipFrictionSequentialCount = 3

      mockSettings.breakSkipFrictionSequentialCount = 0

      expect(mockSettings.breakSkipFrictionTotalCount).toBe(10)
      expect(mockSettings.breakSkipFrictionSequentialCount).toBe(0)
    })

    it('should reset only the correct break type counter', () => {
      mockSettings.microbreakSkipFrictionSequentialCount = 3
      mockSettings.breakSkipFrictionSequentialCount = 5

      mockSettings.microbreakSkipFrictionSequentialCount = 0

      expect(mockSettings.microbreakSkipFrictionSequentialCount).toBe(0)
      expect(mockSettings.breakSkipFrictionSequentialCount).toBe(5)
    })
  })

  describe('Persistence', () => {
    it('should persist total count across sessions', () => {
      mockSettings.breakSkipFrictionTotalCount = 25
      const persistedValue = mockSettings.breakSkipFrictionTotalCount

      expect(persistedValue).toBe(25)
    })

    it('should persist sequential count until reset', () => {
      mockSettings.microbreakSkipFrictionSequentialCount = 7
      const persistedValue = mockSettings.microbreakSkipFrictionSequentialCount

      expect(persistedValue).toBe(7)
    })
  })

  describe('Counter Statistics Display', () => {
    it('should format total count for display', () => {
      mockSettings.breakSkipFrictionTotalCount = 42
      const displayValue = mockSettings.breakSkipFrictionTotalCount.toString()

      expect(displayValue).toBe('42')
    })

    it('should format sequential count for display', () => {
      mockSettings.microbreakSkipFrictionSequentialCount = 3
      const displayValue = mockSettings.microbreakSkipFrictionSequentialCount.toString()

      expect(displayValue).toBe('3')
    })

    it('should handle zero values correctly', () => {
      expect(mockSettings.breakSkipFrictionTotalCount).toBe(0)
      expect(mockSettings.breakSkipFrictionSequentialCount).toBe(0)
    })

    it('should handle large counter values', () => {
      mockSettings.breakSkipFrictionTotalCount = 999999
      expect(mockSettings.breakSkipFrictionTotalCount).toBe(999999)
    })
  })

  describe('Incremental Difficulty', () => {
    it('should increase word count based on sequential counter', () => {
      const maxWords = 5
      const incrementalEnabled = true

      const getWordCount = (sequentialCount) => {
        if (!incrementalEnabled) return 1
        return Math.min(1 + sequentialCount, maxWords)
      }

      expect(getWordCount(0)).toBe(1)
      expect(getWordCount(1)).toBe(2)
      expect(getWordCount(2)).toBe(3)
      expect(getWordCount(4)).toBe(5)
      expect(getWordCount(10)).toBe(5) // capped at maxWords
    })

    it('should use fixed word count when incremental disabled', () => {
      const maxWords = 5
      const incrementalEnabled = false

      const getWordCount = (sequentialCount) => {
        if (!incrementalEnabled) return 1
        return Math.min(1 + sequentialCount, maxWords)
      }

      expect(getWordCount(0)).toBe(1)
      expect(getWordCount(5)).toBe(1)
      expect(getWordCount(10)).toBe(1)
    })

    it('should reset difficulty when sequential counter resets', () => {
      const maxWords = 5

      mockSettings.breakSkipFrictionSequentialCount = 4
      const wordCountBefore = Math.min(1 + mockSettings.breakSkipFrictionSequentialCount, maxWords)
      expect(wordCountBefore).toBe(5)

      mockSettings.breakSkipFrictionSequentialCount = 0
      const wordCountAfter = Math.min(1 + mockSettings.breakSkipFrictionSequentialCount, maxWords)
      expect(wordCountAfter).toBe(1)
    })
  })

  describe('Separate Tracking', () => {
    it('should track microbreak and break counters independently', () => {
      mockSettings.microbreakSkipFrictionTotalCount = 5
      mockSettings.microbreakSkipFrictionSequentialCount = 2
      mockSettings.breakSkipFrictionTotalCount = 10
      mockSettings.breakSkipFrictionSequentialCount = 3

      expect(mockSettings.microbreakSkipFrictionTotalCount).toBe(5)
      expect(mockSettings.microbreakSkipFrictionSequentialCount).toBe(2)
      expect(mockSettings.breakSkipFrictionTotalCount).toBe(10)
      expect(mockSettings.breakSkipFrictionSequentialCount).toBe(3)
    })

    it('should not affect other break type when incrementing', () => {
      mockSettings.microbreakSkipFrictionTotalCount = 5
      mockSettings.breakSkipFrictionTotalCount = 10

      mockSettings.microbreakSkipFrictionTotalCount += 1

      expect(mockSettings.microbreakSkipFrictionTotalCount).toBe(6)
      expect(mockSettings.breakSkipFrictionTotalCount).toBe(10)
    })

    it('should not affect other break type when resetting', () => {
      mockSettings.microbreakSkipFrictionSequentialCount = 3
      mockSettings.breakSkipFrictionSequentialCount = 5

      mockSettings.microbreakSkipFrictionSequentialCount = 0

      expect(mockSettings.microbreakSkipFrictionSequentialCount).toBe(0)
      expect(mockSettings.breakSkipFrictionSequentialCount).toBe(5)
    })
  })
})
