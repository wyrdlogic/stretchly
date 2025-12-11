import { randomUUID } from 'crypto'
import log from 'electron-log'

/**
 * Validates time-of-day format (HH:mm in 24-hour format)
 * @param {string} timeOfDay - Time string to validate
 * @throws {Error} If time format is invalid
 */
export function validateTimeOfDay (timeOfDay) {
  const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  if (!timePattern.test(timeOfDay)) {
    throw new Error(`Invalid time format: ${timeOfDay}. Expected HH:mm (24-hour)`)
  }
}

/**
 * Validates break count value (must be integer >= 2)
 * @param {number} breakCount - Break count to validate
 * @throws {Error} If break count is invalid
 */
export function validateBreakCount (breakCount) {
  if (!Number.isInteger(breakCount)) {
    throw new Error(`Break count must be an integer, got: ${breakCount}`)
  }
  if (breakCount < 2) {
    throw new Error(`Break count must be >= 2, got: ${breakCount}`)
  }
}

/**
 * Validates duration value (must be positive integer in milliseconds)
 * @param {number} duration - Duration to validate
 * @throws {Error} If duration is invalid
 */
export function validateDuration (duration) {
  if (!Number.isInteger(duration) || duration <= 0) {
    throw new Error(`Duration must be a positive integer, got: ${duration}`)
  }
}

/**
 * Creates a new extended break trigger
 * @param {Object} settings - Electron-store settings instance
 * @param {Object} config - Trigger configuration
 * @param {string} config.type - Trigger type ('time-of-day' or 'break-count')
 * @param {number} config.duration - Break duration in milliseconds
 * @param {boolean} [config.enabled=true] - Whether trigger is enabled
 * @param {string} [config.timeOfDay] - Time in HH:mm format (required for time-of-day)
 * @param {number} [config.breakCount] - Break count (required for break-count)
 * @returns {Object} Created trigger with generated ID
 * @throws {Error} If validation fails
 */
export function createTrigger (settings, config) {
  const trigger = {
    id: randomUUID(),
    enabled: config.enabled ?? true,
    type: config.type,
    duration: config.duration
  }

  if (config.type === 'time-of-day') {
    validateTimeOfDay(config.timeOfDay)
    trigger.timeOfDay = config.timeOfDay
    trigger.breakCount = null
  } else if (config.type === 'break-count') {
    validateBreakCount(config.breakCount)
    trigger.breakCount = config.breakCount
    trigger.timeOfDay = null
  } else {
    throw new Error(`Invalid type: ${config.type}. Expected 'time-of-day' or 'break-count'`)
  }

  validateDuration(config.duration)

  const triggers = getTriggers(settings)
  triggers.push(trigger)
  settings.set('extendedBreakTriggers', triggers)

  return trigger
}

/**
 * Retrieves all extended break triggers from settings
 * @param {Object} settings - Electron-store settings instance
 * @returns {Array} Array of trigger objects (empty array if none exist or error)
 */
export function getTriggers (settings) {
  try {
    const triggers = settings.get('extendedBreakTriggers')
    if (!Array.isArray(triggers)) {
      log.warn('Stretchly: extendedBreakTriggers is not an array, returning empty array')
      return []
    }
    return triggers
  } catch (error) {
    log.error('Stretchly: Failed to load extended break triggers, returning empty array:', error)
    return []
  }
}

/**
 * Retrieves a specific trigger by ID
 * @param {Object} settings - Electron-store settings instance
 * @param {string} id - Trigger UUID
 * @returns {Object|null} Trigger object or null if not found
 */
export function getTriggerById (settings, id) {
  const triggers = getTriggers(settings)
  return triggers.find(t => t.id === id) || null
}

/**
 * Updates an existing trigger
 * @param {Object} settings - Electron-store settings instance
 * @param {string} id - Trigger UUID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated trigger object
 * @throws {Error} If trigger not found or validation fails
 */
export function updateTrigger (settings, id, updates) {
  if (updates.id && updates.id !== id) {
    throw new Error('Cannot change trigger ID')
  }

  const triggers = getTriggers(settings)
  const index = triggers.findIndex(t => t.id === id)

  if (index === -1) {
    throw new Error(`Trigger not found: ${id}`)
  }

  const currentTrigger = triggers[index]
  const updatedTrigger = { ...currentTrigger, ...updates }

  if (updatedTrigger.type === 'time-of-day') {
    if (updatedTrigger.timeOfDay) {
      validateTimeOfDay(updatedTrigger.timeOfDay)
    }
    updatedTrigger.breakCount = null
  } else if (updatedTrigger.type === 'break-count') {
    if (updatedTrigger.breakCount !== null && updatedTrigger.breakCount !== undefined) {
      validateBreakCount(updatedTrigger.breakCount)
    }
    updatedTrigger.timeOfDay = null
  }

  if (updatedTrigger.duration !== currentTrigger.duration) {
    validateDuration(updatedTrigger.duration)
  }

  triggers[index] = updatedTrigger
  settings.set('extendedBreakTriggers', triggers)

  return updatedTrigger
}

/**
 * Deletes a trigger by ID
 * @param {Object} settings - Electron-store settings instance
 * @param {string} id - Trigger UUID
 * @returns {boolean} True if deleted successfully
 * @throws {Error} If trigger not found
 */
export function deleteTrigger (settings, id) {
  const triggers = getTriggers(settings)
  const filtered = triggers.filter(t => t.id !== id)

  if (filtered.length === triggers.length) {
    throw new Error(`Trigger not found: ${id}`)
  }

  settings.set('extendedBreakTriggers', filtered)
  return true
}
