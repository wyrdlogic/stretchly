# API Contract: Extended Break Trigger Management

## Overview

This document defines the internal API contracts for managing extended break triggers in Stretchly. Since Stretchly is a desktop application (not a web service), these are **internal JavaScript APIs** used by the main process, renderer processes, and IPC communication.

---

## 1. Settings CRUD API

### Location: `app/utils/extendedBreakTriggers.js` (New File)

These functions provide a clean interface for managing triggers in electron-store, encapsulating validation logic.

---

### `createTrigger(settings, config)`

Create a new extended break trigger and persist to settings.

**Parameters:**
```javascript
{
  settings: ElectronStore,  // electron-store instance
  config: {
    type: 'time-of-day' | 'break-count',
    timeOfDay?: String,  // Required if type='time-of-day', format 'HH:mm'
    breakCount?: Number, // Required if type='break-count', integer >= 2
    duration: Number,    // Milliseconds, integer > 0
    enabled?: Boolean    // Optional, defaults to true
  }
}
```

**Returns:** `ExtendedBreakTrigger` (created object with generated ID)

**Throws:**
- `Error('Invalid type')` - type not in allowed enum
- `Error('timeOfDay required for time-of-day trigger')` - missing required field
- `Error('breakCount required for break-count trigger')` - missing required field
- `Error('Invalid time format')` - timeOfDay doesn't match HH:mm pattern
- `Error('breakCount must be >= 2')` - below minimum threshold
- `Error('Duration must be positive')` - duration <= 0

**Example:**
```javascript
const trigger = createTrigger(settings, {
  type: 'time-of-day',
  timeOfDay: '14:00',
  duration: 600000  // 10 minutes
})
// Returns: { id: 'uuid', enabled: true, type: 'time-of-day', timeOfDay: '14:00', breakCount: null, duration: 600000 }
```

**Side Effects:**
- Appends new trigger to `settings.get('extendedBreakTriggers')` array
- Calls `settings.set('extendedBreakTriggers', updatedArray)`
- Persists immediately to disk (electron-store behavior)

---

### `getTriggers(settings)`

Retrieve all extended break triggers.

**Parameters:**
```javascript
{
  settings: ElectronStore
}
```

**Returns:** `Array<ExtendedBreakTrigger>` (empty array if none exist)

**Throws:** None (returns `[]` if setting undefined or corrupted)

**Example:**
```javascript
const triggers = getTriggers(settings)
// Returns: [{ id: 'uuid1', ... }, { id: 'uuid2', ... }]
```

**Side Effects:** None (read-only)

---

### `getTriggerById(settings, id)`

Retrieve a specific trigger by ID.

**Parameters:**
```javascript
{
  settings: ElectronStore,
  id: String  // UUID
}
```

**Returns:** `ExtendedBreakTrigger | null` (null if not found)

**Throws:** None

**Example:**
```javascript
const trigger = getTriggerById(settings, 'a3f8b4c2-1e7d-4a9b-8c3e-5f2d1a0b4c6e')
// Returns: { id: 'a3f8b4c2...', ... } or null
```

**Side Effects:** None (read-only)

---

### `updateTrigger(settings, id, updates)`

Update an existing trigger (partial update supported).

**Parameters:**
```javascript
{
  settings: ElectronStore,
  id: String,  // UUID of trigger to update
  updates: {
    enabled?: Boolean,
    type?: 'time-of-day' | 'break-count',
    timeOfDay?: String,
    breakCount?: Number,
    duration?: Number
  }
}
```

**Returns:** `ExtendedBreakTrigger` (updated object)

**Throws:**
- `Error('Trigger not found')` - ID doesn't exist
- `Error('Cannot change trigger ID')` - updates includes 'id' field
- Same validation errors as `createTrigger` for changed fields

**Example:**
```javascript
const updated = updateTrigger(settings, 'uuid', { duration: 900000 })
// Returns: { id: 'uuid', ..., duration: 900000 }
```

**Side Effects:**
- Replaces trigger at index in array
- Calls `settings.set('extendedBreakTriggers', updatedArray)`
- Persists immediately to disk

**Notes:**
- Partial updates supported (only changed fields need to be passed)
- Cross-field validation runs on merged object (e.g., changing type from 'time-of-day' to 'break-count' requires adding breakCount)

---

### `deleteTrigger(settings, id)`

Delete a trigger by ID.

**Parameters:**
```javascript
{
  settings: ElectronStore,
  id: String  // UUID
}
```

**Returns:** `void`

**Throws:**
- `Error('Trigger not found')` - ID doesn't exist

**Example:**
```javascript
deleteTrigger(settings, 'uuid')
// Trigger removed from array, settings persisted
```

**Side Effects:**
- Filters out trigger from array
- Calls `settings.set('extendedBreakTriggers', filteredArray)`
- Persists immediately to disk

---

## 2. Trigger Evaluation API

### Location: `app/breaksPlanner.js` (Extend Existing Class)

These methods integrate with BreaksPlanner to evaluate triggers and compute duration overrides.

---

### `_getBreakDuration()` (Private)

Compute break duration, applying trigger overrides if applicable.

**Parameters:** None (uses instance state: `this.settings`, `this.breakNumber`, etc.)

**Returns:** `Number` (milliseconds for break duration)

**Logic:**
```javascript
_getBreakDuration () {
  const baseDuration = this.settings.get('breakDuration')
  
  // Only apply triggers to long breaks, not microbreaks
  if (this._scheduledBreakType !== 'break') {
    return baseDuration
  }
  
  const overrideDuration = this._evaluateExtendedBreakTriggers()
  return overrideDuration || baseDuration
}
```

**Side Effects:**
- May add IDs to `this.triggeredTodayIds`
- May log to electron-log
- Updates `this.lastTriggerEvaluationDate` if day changed

---

### `_evaluateExtendedBreakTriggers()` (Private)

Evaluate all enabled triggers, return longest matching duration or null.

**Parameters:** None (uses instance state)

**Returns:** `Number | null` (milliseconds if any trigger matches, null otherwise)

**Logic:**
```javascript
_evaluateExtendedBreakTriggers () {
  this._resetDailyStateIfNeeded()
  
  const triggers = this.settings.get('extendedBreakTriggers')
  const enabledTriggers = triggers.filter(t => t.enabled)
  
  let maxDuration = null
  
  for (const trigger of enabledTriggers) {
    const duration = this._evaluateSingleTrigger(trigger)
    if (duration !== null && (maxDuration === null || duration > maxDuration)) {
      maxDuration = duration
    }
  }
  
  return maxDuration
}
```

**Side Effects:**
- Calls `_resetDailyStateIfNeeded()` which may clear `triggeredTodayIds`
- Calls `_evaluateSingleTrigger()` which may log and update state

---

### `_evaluateSingleTrigger(trigger)` (Private)

Evaluate a single trigger, return duration if it matches, null otherwise.

**Parameters:**
```javascript
{
  trigger: ExtendedBreakTrigger
}
```

**Returns:** `Number | null` (duration in milliseconds if trigger matches, null otherwise)

**Logic:**
```javascript
_evaluateSingleTrigger (trigger) {
  if (trigger.type === 'time-of-day') {
    return this._evaluateTimeOfDayTrigger(trigger)
  } else if (trigger.type === 'break-count') {
    return this._evaluateBreakCountTrigger(trigger)
  }
  return null
}
```

**Side Effects:**
- Delegates to type-specific methods which may update state

---

### `_evaluateTimeOfDayTrigger(trigger)` (Private)

Check if current time matches trigger time and trigger hasn't fired today.

**Parameters:**
```javascript
{
  trigger: ExtendedBreakTrigger  // type: 'time-of-day'
}
```

**Returns:** `Number | null`

**Logic:**
```javascript
_evaluateTimeOfDayTrigger (trigger) {
  // Skip if already triggered today
  if (this.triggeredTodayIds.has(trigger.id)) {
    return null
  }
  
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  
  if (currentTime === trigger.timeOfDay) {
    this.triggeredTodayIds.add(trigger.id)
    log.info(`Stretchly: time-of-day trigger activated (${trigger.timeOfDay}), extending break to ${trigger.duration / 60000} minutes`)
    return trigger.duration
  }
  
  return null
}
```

**Side Effects:**
- Adds trigger ID to `this.triggeredTodayIds` on match
- Logs to electron-log

**Notes:**
- Minute-level precision (no seconds check)
- Timezone-agnostic (uses local system time)

---

### `_evaluateBreakCountTrigger(trigger)` (Private)

Check if current consecutive break count matches trigger threshold.

**Parameters:**
```javascript
{
  trigger: ExtendedBreakTrigger  // type: 'break-count'
}
```

**Returns:** `Number | null`

**Logic:**
```javascript
_evaluateBreakCountTrigger (trigger) {
  const shouldBreak = this.settings.get('break')
  const shouldMicrobreak = this.settings.get('microbreak')
  
  if (!shouldBreak || !shouldMicrobreak) {
    return null  // Break-count triggers require both break types enabled
  }
  
  const breakInterval = this.settings.get('breakInterval') + 1
  
  // Check if this is a long break (not microbreak)
  if (this.breakNumber % breakInterval !== 0) {
    return null
  }
  
  // Calculate consecutive long break count
  const consecutiveLongBreaks = Math.floor(this.breakNumber / breakInterval)
  
  if (consecutiveLongBreaks === trigger.breakCount) {
    log.info(`Stretchly: break-count trigger activated (${trigger.breakCount} consecutive breaks), extending break to ${trigger.duration / 60000} minutes`)
    return trigger.duration
  }
  
  return null
}
```

**Side Effects:**
- Logs to electron-log on match
- No persistent state change (count managed by existing `this.breakNumber`)

**Notes:**
- Triggers exactly once per threshold (e.g., at break 6, 12, 18 for breakCount=3)
- Resets when `this.clear()` called (idle detection, user reset, pause)

---

### `_resetDailyStateIfNeeded()` (Private)

Check if date changed, reset daily state if so.

**Parameters:** None

**Returns:** `void`

**Logic:**
```javascript
_resetDailyStateIfNeeded () {
  const currentDate = new Date().toDateString()
  
  if (currentDate !== this.lastTriggerEvaluationDate) {
    this.triggeredTodayIds.clear()
    this.lastTriggerEvaluationDate = currentDate
    log.info('Stretchly: daily reset for extended break triggers')
  }
}
```

**Side Effects:**
- Clears `this.triggeredTodayIds` on date change
- Updates `this.lastTriggerEvaluationDate`
- Logs to electron-log

**Notes:**
- Called at start of every trigger evaluation
- Handles computer sleep, system time changes, DST transitions

---

## 3. IPC Communication API

### Location: IPC channels between main and renderer processes

Used by preferences window to manage triggers.

---

### `ipcMain.handle('get-extended-break-triggers')`

**Request (from renderer):**
```javascript
ipcRenderer.invoke('get-extended-break-triggers')
```

**Response (from main):**
```javascript
{
  success: true,
  data: Array<ExtendedBreakTrigger>
}
```

**Handler (in main.js):**
```javascript
ipcMain.handle('get-extended-break-triggers', () => {
  const triggers = getTriggers(settings)
  return { success: true, data: triggers }
})
```

---

### `ipcMain.handle('create-extended-break-trigger')`

**Request (from renderer):**
```javascript
ipcRenderer.invoke('create-extended-break-trigger', {
  type: 'time-of-day',
  timeOfDay: '14:00',
  duration: 600000
})
```

**Response (from main):**
```javascript
{
  success: true,
  data: ExtendedBreakTrigger  // Created object with ID
}
// OR
{
  success: false,
  error: 'Validation error message'
}
```

**Handler (in main.js):**
```javascript
ipcMain.handle('create-extended-break-trigger', (event, config) => {
  try {
    const trigger = createTrigger(settings, config)
    return { success: true, data: trigger }
  } catch (err) {
    return { success: false, error: err.message }
  }
})
```

---

### `ipcMain.handle('update-extended-break-trigger')`

**Request (from renderer):**
```javascript
ipcRenderer.invoke('update-extended-break-trigger', {
  id: 'uuid',
  updates: { duration: 900000 }
})
```

**Response (from main):**
```javascript
{
  success: true,
  data: ExtendedBreakTrigger  // Updated object
}
// OR
{
  success: false,
  error: 'Trigger not found' | 'Validation error'
}
```

**Handler (in main.js):**
```javascript
ipcMain.handle('update-extended-break-trigger', (event, { id, updates }) => {
  try {
    const trigger = updateTrigger(settings, id, updates)
    return { success: true, data: trigger }
  } catch (err) {
    return { success: false, error: err.message }
  }
})
```

---

### `ipcMain.handle('delete-extended-break-trigger')`

**Request (from renderer):**
```javascript
ipcRenderer.invoke('delete-extended-break-trigger', 'uuid')
```

**Response (from main):**
```javascript
{
  success: true
}
// OR
{
  success: false,
  error: 'Trigger not found'
}
```

**Handler (in main.js):**
```javascript
ipcMain.handle('delete-extended-break-trigger', (event, id) => {
  try {
    deleteTrigger(settings, id)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})
```

---

## 4. Validation Helper API

### Location: `app/utils/extendedBreakTriggers.js`

---

### `validateTriggerConfig(config)`

Validate trigger configuration before creation/update.

**Parameters:**
```javascript
{
  config: {
    type: String,
    timeOfDay?: String,
    breakCount?: Number,
    duration: Number,
    enabled?: Boolean
  }
}
```

**Returns:** `{ valid: true } | { valid: false, errors: Array<String> }`

**Example:**
```javascript
const result = validateTriggerConfig({
  type: 'time-of-day',
  timeOfDay: '25:00',  // Invalid hour
  duration: 0  // Invalid duration
})
// Returns: { valid: false, errors: ['Invalid time format: 25:00', 'Duration must be positive'] }
```

**Logic:**
```javascript
function validateTriggerConfig (config) {
  const errors = []
  
  // Type validation
  if (!['time-of-day', 'break-count'].includes(config.type)) {
    errors.push(`Invalid type: ${config.type}`)
  }
  
  // Type-specific validation
  if (config.type === 'time-of-day') {
    if (!config.timeOfDay) {
      errors.push('timeOfDay required for time-of-day trigger')
    } else if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(config.timeOfDay)) {
      errors.push(`Invalid time format: ${config.timeOfDay}`)
    }
  }
  
  if (config.type === 'break-count') {
    if (!config.breakCount) {
      errors.push('breakCount required for break-count trigger')
    } else if (!Number.isInteger(config.breakCount) || config.breakCount < 2) {
      errors.push('breakCount must be integer >= 2')
    }
  }
  
  // Duration validation
  if (!Number.isInteger(config.duration) || config.duration <= 0) {
    errors.push('Duration must be positive integer')
  }
  
  return errors.length === 0 ? { valid: true } : { valid: false, errors }
}
```

---

## 5. Error Handling

### Error Types

**Validation Errors:**
- Message format: `'<Field> <constraint>'` (e.g., `'timeOfDay required for time-of-day trigger'`)
- Thrown by: `createTrigger`, `updateTrigger`
- Caught by: IPC handlers, displayed to user in preferences UI

**Not Found Errors:**
- Message: `'Trigger not found: <id>'`
- Thrown by: `updateTrigger`, `deleteTrigger`, `getTriggerById` (returns null instead)
- Caught by: IPC handlers, displayed to user

**System Errors:**
- electron-store write failures (disk full, permissions)
- Handled by electron-store internally (throws exceptions)
- Caught by: IPC handlers, logged to electron-log

### Error Response Format (IPC)
```javascript
{
  success: false,
  error: String  // Human-readable error message
}
```

---

## 6. API Usage Examples

### Example 1: Creating a Time-of-Day Trigger from Preferences UI

**Renderer (preferences-renderer.js):**
```javascript
async function handleAddTrigger () {
  const config = {
    type: 'time-of-day',
    timeOfDay: document.getElementById('triggerTime').value,  // '14:00'
    duration: parseInt(document.getElementById('triggerDuration').value) * 60000  // Convert minutes to ms
  }
  
  const result = await ipcRenderer.invoke('create-extended-break-trigger', config)
  
  if (result.success) {
    refreshTriggerTable()  // Reload table
  } else {
    alert(`Error: ${result.error}`)
  }
}
```

---

### Example 2: Evaluating Triggers During Break Start

**Main Process (breaksPlanner.js):**
```javascript
this.on('breakStarted', (shouldPlaySound) => {
  const interval = this._getBreakDuration()  // Calls trigger evaluation
  this.scheduler = new Scheduler(() => this.emit('finishBreak', shouldPlaySound, true), interval, 'finishBreak')
  this.scheduler.plan()
})
```

**Console Output (electron-log):**
```
[2024-01-15 14:00:05] Stretchly: time-of-day trigger activated (14:00), extending break to 10 minutes
[2024-01-15 14:00:05] Stretchly: break started (duration: 600000ms)
```

---

### Example 3: Updating Trigger from Preferences UI

**Renderer:**
```javascript
async function handleEditTrigger (triggerId) {
  const newDuration = parseInt(prompt('Enter new duration (minutes):')) * 60000
  
  const result = await ipcRenderer.invoke('update-extended-break-trigger', {
    id: triggerId,
    updates: { duration: newDuration }
  })
  
  if (result.success) {
    refreshTriggerTable()
  } else {
    alert(`Error: ${result.error}`)
  }
}
```

---

## Summary

### API Modules: 4
1. **Settings CRUD** (`extendedBreakTriggers.js`): 5 functions (create, read, readById, update, delete)
2. **Trigger Evaluation** (`breaksPlanner.js`): 6 private methods (get duration, evaluate all, evaluate single, evaluate by type x2, reset daily)
3. **IPC Communication** (`main.js` ↔ `preferences-renderer.js`): 4 channels (get, create, update, delete)
4. **Validation Helpers** (`extendedBreakTriggers.js`): 1 function (validate config)

### Error Types: 3
- Validation errors (field constraints)
- Not found errors (ID doesn't exist)
- System errors (storage failures)

### Integration Points: 2
- Main → BreaksPlanner: Trigger evaluation during break start
- Renderer → Main: IPC for CRUD operations from preferences UI

All APIs follow existing Stretchly patterns (StandardJS, ES modules, electron-store, electron-log, event-driven).
