import { randomUUID } from 'crypto'

export function validateTimeOfDay (timeOfDay) {
  const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  if (!timePattern.test(timeOfDay)) {
    throw new Error(`Invalid time format: ${timeOfDay}. Expected HH:mm (24-hour)`)
  }
}

export function validateBreakCount (breakCount) {
  if (!Number.isInteger(breakCount)) {
    throw new Error(`Break count must be an integer, got: ${breakCount}`)
  }
  if (breakCount < 2) {
    throw new Error(`Break count must be >= 2, got: ${breakCount}`)
  }
}

export function validateDuration (duration) {
  if (!Number.isInteger(duration) || duration <= 0) {
    throw new Error(`Duration must be a positive integer, got: ${duration}`)
  }
}

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

export function getTriggers (settings) {
  try {
    const triggers = settings.get('extendedBreakTriggers')
    return Array.isArray(triggers) ? triggers : []
  } catch (error) {
    console.error('Stretchly: Failed to load extended break triggers:', error)
    return []
  }
}

export function getTriggerById (settings, id) {
  const triggers = getTriggers(settings)
  return triggers.find(t => t.id === id) || null
}

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

export function deleteTrigger (settings, id) {
  const triggers = getTriggers(settings)
  const filtered = triggers.filter(t => t.id !== id)

  if (filtered.length === triggers.length) {
    throw new Error(`Trigger not found: ${id}`)
  }

  settings.set('extendedBreakTriggers', filtered)
  return true
}
