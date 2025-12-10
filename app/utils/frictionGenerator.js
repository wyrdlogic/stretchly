const NUMBERS = '0123456789'
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const SPECIAL = '!@#$%^&*()_+-=[]{}|;:,.<>?'

function getRandomChars (charset, count) {
  const result = []
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    result.push(charset[randomIndex])
  }
  return result
}

function shuffleArray (array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function generateRandomString (length) {
  if (length < 1 || length > 50) {
    throw new Error('String length must be between 1 and 50')
  }

  const charsPerClass = Math.floor(length / 4)
  const remainder = length % 4

  const chars = []

  chars.push(...getRandomChars(NUMBERS, charsPerClass + (remainder > 0 ? 1 : 0)))
  chars.push(...getRandomChars(LOWERCASE, charsPerClass + (remainder > 1 ? 1 : 0)))
  chars.push(...getRandomChars(UPPERCASE, charsPerClass + (remainder > 2 ? 1 : 0)))
  chars.push(...getRandomChars(SPECIAL, charsPerClass))

  return shuffleArray(chars).join('')
}

export function generateFrictionStrings (charLength, sequentialCount, maxWords, incrementalEnabled) {
  if (!incrementalEnabled) {
    return [generateRandomString(charLength)]
  }

  const wordCount = Math.min(1 + sequentialCount, maxWords)
  const words = []

  for (let i = 0; i < wordCount; i++) {
    words.push(generateRandomString(charLength))
  }

  return words
}
