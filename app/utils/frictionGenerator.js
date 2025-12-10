const NUMBERS = '0123456789'
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const SPECIAL = '!@#$%^&*()_+-=[]{}|;:,.<>?'

/**
 * Generates an array of random characters from the given charset
 * @param {string} charset - The character set to choose from
 * @param {number} count - Number of characters to generate
 * @returns {Array<string>} Array of random characters
 */
function getRandomChars (charset, count) {
  const result = []
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    result.push(charset[randomIndex])
  }
  return result
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} A new shuffled array
 */
function shuffleArray (array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Generates a random string of specified length containing mixed character classes
 * @param {number} length - Length of the string to generate (1-50)
 * @returns {string} Random string with numbers, lowercase, uppercase, and special characters
 * @throws {Error} If length is not between 1 and 50
 */
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

/**
 * Generates friction challenge strings based on user skip behavior
 * @param {number} charLength - Length of each random string (1-50)
 * @param {number} sequentialCount - Number of consecutive skips
 * @param {number} maxWords - Maximum number of words to generate
 * @param {boolean} incrementalEnabled - Whether to increase difficulty based on sequential skips
 * @returns {Array<string>} Array of random strings for friction challenge
 */
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
