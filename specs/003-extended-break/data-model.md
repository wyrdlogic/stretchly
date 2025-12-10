# Data Model: Extended Break Triggers

## Overview

This document defines the data model for extended break triggers feature, including entity schemas, validation rules, state management, and persistence strategy.

---

## 1. Core Entity: ExtendedBreakTrigger

### Schema Definition

```javascript
{
  id: String,           // UUID v4, immutable
  enabled: Boolean,     // Default: true
  type: String,         // Enum: 'time-of-day' | 'break-count'
  timeOfDay: String?,   // Optional, format: 'HH:mm' (24-hour), required if type='time-of-day'
  breakCount: Number?,  // Optional, integer >= 2, required if type='break-count'
  duration: Number      // Milliseconds, integer > 0, no maximum
}
```

### Field Specifications

#### `id` (String, Required, Immutable)
- **Purpose**: Unique identifier for trigger instance
- **Format**: UUID v4 (e.g., `'3f8b4c2a-1e7d-4a9b-8c3e-5f2d1a0b4c6e'`)
- **Generation**: On creation via `crypto.randomUUID()` (Node 19+)
- **Constraints**: 
  - Must be unique across all triggers
  - Cannot be changed after creation
  - Used for tracking "already triggered today" state
- **Validation**: `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`

#### `enabled` (Boolean, Required)
- **Purpose**: Allow user to temporarily disable trigger without deleting
- **Default**: `true`
- **Constraints**: Must be boolean
- **Behavior**: 
  - `false` → trigger excluded from evaluation
  - `true` → trigger participates in evaluation (if other conditions met)

#### `type` (String, Required)
- **Purpose**: Determines trigger evaluation logic
- **Values**: 
  - `'time-of-day'`: Triggers when current time matches configured time
  - `'break-count'`: Triggers when consecutive long break count reaches threshold
- **Constraints**: Must be one of allowed values (enum validation)
- **Immutability**: Can be changed post-creation (user can switch trigger type)

#### `timeOfDay` (String, Optional)
- **Purpose**: Configured time for time-of-day triggers
- **Format**: `'HH:mm'` (24-hour, zero-padded)
- **Examples**: `'09:00'`, `'14:30'`, `'23:59'`
- **Constraints**:
  - Required when `type === 'time-of-day'`
  - Must be `null` or `undefined` when `type === 'break-count'`
  - Hours: `00`-`23`, Minutes: `00`-`59`
- **Validation**: `/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/`
- **Precision**: Minute-level (no seconds)
- **Timezone**: Always local time (no UTC conversion)

#### `breakCount` (Number, Optional)
- **Purpose**: Threshold for consecutive long break count triggers
- **Constraints**:
  - Required when `type === 'break-count'`
  - Must be `null` or `undefined` when `type === 'time-of-day'`
  - Minimum value: `2` (per FR-003)
  - Must be integer (no decimals)
  - Maximum value: No limit (practical limit ~100)
- **Validation**: `Number.isInteger(breakCount) && breakCount >= 2`
- **Examples**: `2` (every 2nd break), `5` (every 5th break)

#### `duration` (Number, Required)
- **Purpose**: Override duration for long break when trigger activates
- **Format**: Milliseconds
- **Constraints**:
  - Must be integer > 0
  - No maximum value (per clarification Q4)
  - Practical range: 60000ms (1 min) - 3600000ms (1 hour)
- **Validation**: `Number.isInteger(duration) && duration > 0`
- **Display Conversion**: Divide by 60000 for minutes in UI

---

## 2. Cross-Field Validation Rules

**NOTE**: These validation rules are the single source of truth. API contracts in `contracts/api-contract.md` should reference these rules rather than duplicating them.


### Rule 1: Type-Specific Required Fields
```javascript
function validateTrigger(trigger) {
  if (trigger.type === 'time-of-day') {
    if (!trigger.timeOfDay || trigger.timeOfDay === '') {
      throw new Error('timeOfDay required for time-of-day trigger')
    }
    if (trigger.breakCount !== null && trigger.breakCount !== undefined) {
      throw new Error('breakCount must be null for time-of-day trigger')
    }
  }
  
  if (trigger.type === 'break-count') {
    if (!trigger.breakCount) {
      throw new Error('breakCount required for break-count trigger')
    }
    if (trigger.timeOfDay !== null && trigger.timeOfDay !== '') {
      throw new Error('timeOfDay must be null for break-count trigger')
    }
  }
}
```

### Rule 2: Time Format Validation
```javascript
function validateTimeOfDay(timeOfDay) {
  const pattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  if (!pattern.test(timeOfDay)) {
    throw new Error(`Invalid time format: ${timeOfDay}. Expected HH:mm (24-hour)`)
  }
}
```

### Rule 3: Unique ID Constraint
```javascript
function validateUniqueId(triggers, newId) {
  const existingIds = triggers.map(t => t.id)
  if (existingIds.includes(newId)) {
    throw new Error(`Duplicate trigger ID: ${newId}`)
  }
}
```

---

## 3. State Management

### Runtime State (In-Memory, BreaksPlanner Instance)

```javascript
class BreaksPlanner extends EventEmitter {
  constructor (settings) {
    super()
    // Existing state...
    
    // New state for extended breaks
    this.lastTriggerEvaluationDate = new Date().toDateString()  // 'Mon Jan 01 2024'
    this.triggeredTodayIds = new Set()  // Set of trigger IDs that fired today
  }
}
```

#### `lastTriggerEvaluationDate` (String)
- **Purpose**: Detect midnight boundary for daily reset
- **Format**: Output of `Date.toDateString()` (e.g., `'Mon Jan 01 2024'`)
- **Update**: On every trigger evaluation, compare current date → reset if changed
- **Persistence**: Not persisted (resets on app restart, expected behavior)

#### `triggeredTodayIds` (Set<String>)
- **Purpose**: Track which triggers have already fired today (prevents duplicate firing)
- **Contents**: Set of trigger IDs that activated since last midnight
- **Update**: Add ID when trigger fires, clear on date change
- **Persistence**: Not persisted (resets on app restart, expected behavior per FR-020)

### Persisted State (electron-store)

```javascript
// In defaultSettings.js
export default {
  // ... existing settings ...
  extendedBreakTriggers: []  // Array<ExtendedBreakTrigger>
}
```

#### Storage Strategy
- **Key**: `'extendedBreakTriggers'`
- **Value**: JSON array of trigger objects
- **Location**: `~/.config/Stretchly/config.json` (Linux) or equivalent per platform
- **Serialization**: Automatic via electron-store (JSON.stringify/parse)
- **Access Pattern**: 
  - Read: `settings.get('extendedBreakTriggers')` → returns array (empty if not set)
  - Write: `settings.set('extendedBreakTriggers', triggers)` → saves immediately
- **Atomicity**: electron-store ensures atomic writes (no partial saves)

---

## 4. Entity Lifecycle

### Creation
```javascript
function createTrigger(type, config) {
  const trigger = {
    id: crypto.randomUUID(),
    enabled: true,
    type: type,
    duration: config.duration
  }
  
  if (type === 'time-of-day') {
    trigger.timeOfDay = config.timeOfDay
    trigger.breakCount = null
  } else if (type === 'break-count') {
    trigger.breakCount = config.breakCount
    trigger.timeOfDay = null
  }
  
  validateTrigger(trigger)
  return trigger
}
```

### Read
```javascript
function getAllTriggers(settings) {
  const triggers = settings.get('extendedBreakTriggers')
  return Array.isArray(triggers) ? triggers : []
}

function getTriggerById(settings, id) {
  const triggers = getAllTriggers(settings)
  return triggers.find(t => t.id === id)
}
```

### Update
```javascript
function updateTrigger(settings, id, updates) {
  const triggers = getAllTriggers(settings)
  const index = triggers.findIndex(t => t.id === id)
  
  if (index === -1) {
    throw new Error(`Trigger not found: ${id}`)
  }
  
  const updatedTrigger = { ...triggers[index], ...updates }
  validateTrigger(updatedTrigger)
  
  triggers[index] = updatedTrigger
  settings.set('extendedBreakTriggers', triggers)
  
  return updatedTrigger
}
```

### Delete
```javascript
function deleteTrigger(settings, id) {
  const triggers = getAllTriggers(settings)
  const filteredTriggers = triggers.filter(t => t.id !== id)
  
  if (filteredTriggers.length === triggers.length) {
    throw new Error(`Trigger not found: ${id}`)
  }
  
  settings.set('extendedBreakTriggers', filteredTriggers)
}
```

---

## 5. State Transitions

### Time-of-Day Trigger State Machine

```
[Created] → [Enabled & Waiting] → [Triggered] → [Used Today]
                   ↑                                  ↓
                   └──────── Midnight Reset ──────────┘
```

#### States
1. **Created**: Trigger added to settings, not yet evaluated
2. **Enabled & Waiting**: `enabled: true`, not in `triggeredTodayIds`, waiting for time match
3. **Triggered**: Time matches, duration override applied, ID added to `triggeredTodayIds`
4. **Used Today**: Cannot trigger again until midnight reset

#### Transitions
- **Creation** → **Enabled & Waiting**: User adds trigger via preferences UI
- **Enabled & Waiting** → **Triggered**: Current time matches `timeOfDay`, not in `triggeredTodayIds`
- **Triggered** → **Used Today**: ID added to `triggeredTodayIds` after duration override applied
- **Used Today** → **Enabled & Waiting**: Midnight detected (`toDateString()` changes), `triggeredTodayIds.clear()`

### Break-Count Trigger State Machine

```
[Created] → [Enabled & Counting] → [Triggered] → [Reset on Idle]
                   ↑                                     ↓
                   └────── BreaksPlanner.clear() ───────┘
```

#### States
1. **Created**: Trigger added to settings, not yet evaluated
2. **Enabled & Counting**: `enabled: true`, tracking `BreaksPlanner.breakNumber`
3. **Triggered**: `breakNumber % breakCount === 0`, duration override applied
4. **Reset on Idle**: Idle detection → `clear()` → `breakNumber = 0` → restart count

#### Transitions
- **Creation** → **Enabled & Counting**: User adds trigger via preferences UI
- **Enabled & Counting** → **Triggered**: `breakNumber` reaches `breakCount` threshold
- **Triggered** → **Enabled & Counting**: Next break starts, increment `breakNumber`, wait for next threshold
- **Enabled & Counting** → **Reset on Idle**: Computer idle → `clear()` → `breakNumber = 0`

---

## 6. Data Integrity Constraints

### Constraint 1: Non-Empty Duration
```javascript
// Prevent accidental zero duration (would skip break entirely)
if (duration <= 0) {
  throw new Error('Duration must be positive')
}
```

### Constraint 2: Valid Type Enum
```javascript
const VALID_TYPES = ['time-of-day', 'break-count']
if (!VALID_TYPES.includes(type)) {
  throw new Error(`Invalid type: ${type}. Must be one of ${VALID_TYPES.join(', ')}`)
}
```

### Constraint 3: Immutable ID
```javascript
function updateTrigger(settings, id, updates) {
  if (updates.id && updates.id !== id) {
    throw new Error('Cannot change trigger ID')
  }
  // ... rest of update logic
}
```

### Constraint 4: Array Consistency
```javascript
// On settings load, ensure extendedBreakTriggers is always an array
function ensureArrayConsistency(settings) {
  const triggers = settings.get('extendedBreakTriggers')
  if (!Array.isArray(triggers)) {
    settings.set('extendedBreakTriggers', [])
  }
}
```

---

## 7. Example Data Instances

### Example 1: Time-of-Day Trigger (Afternoon Break Extension)
```json
{
  "id": "a3f8b4c2-1e7d-4a9b-8c3e-5f2d1a0b4c6e",
  "enabled": true,
  "type": "time-of-day",
  "timeOfDay": "14:00",
  "breakCount": null,
  "duration": 600000
}
```
**Behavior**: First long break at or after 14:00 (2:00 PM) extends to 10 minutes (600000ms)

### Example 2: Break-Count Trigger (Every 3rd Break)
```json
{
  "id": "b7c2d1e3-4f5a-6b8c-9d0e-1a2b3c4d5e6f",
  "enabled": true,
  "type": "break-count",
  "timeOfDay": null,
  "breakCount": 3,
  "duration": 900000
}
```
**Behavior**: Every 3rd consecutive long break extends to 15 minutes (900000ms)

### Example 3: Disabled Trigger
```json
{
  "id": "c8d3e4f5-6a7b-8c9d-0e1f-2a3b4c5d6e7f",
  "enabled": false,
  "type": "time-of-day",
  "timeOfDay": "09:00",
  "breakCount": null,
  "duration": 480000
}
```
**Behavior**: Never triggers (excluded from evaluation due to `enabled: false`)

### Example 4: Multiple Triggers (Conflict Resolution)
```json
[
  {
    "id": "d9e4f5a6-7b8c-9d0e-1f2a-3b4c5d6e7f8a",
    "enabled": true,
    "type": "time-of-day",
    "timeOfDay": "14:00",
    "breakCount": null,
    "duration": 600000
  },
  {
    "id": "e0f5a6b7-8c9d-0e1f-2a3b-4c5d6e7f8a9b",
    "enabled": true,
    "type": "break-count",
    "timeOfDay": null,
    "breakCount": 2,
    "duration": 900000
  }
]
```
**Behavior at 14:05, 2nd consecutive break**: Both triggers activate → Longest duration wins → 900000ms (15 min) used

---

## 8. Migration & Backward Compatibility

### First-Time Load (Version Without Feature)
```javascript
// In BreaksPlanner constructor or settings initialization
const triggers = settings.get('extendedBreakTriggers')
if (triggers === undefined || triggers === null || !Array.isArray(triggers)) {
  settings.set('extendedBreakTriggers', [])
}
```

### Upgrade from Future Version (Schema Evolution)
```javascript
// If new fields added in v2, ensure backward compatibility
function migrateTriggerSchema(trigger) {
  return {
    id: trigger.id || crypto.randomUUID(),
    enabled: trigger.enabled ?? true,
    type: trigger.type || 'time-of-day',
    timeOfDay: trigger.timeOfDay || null,
    breakCount: trigger.breakCount || null,
    duration: trigger.duration || 300000,
    // Future fields with defaults...
  }
}
```

### Downgrade Handling (User Rolls Back Version)
- Older version ignores `extendedBreakTriggers` setting (unknown keys preserved)
- No data loss → triggers reappear if user upgrades again
- No crash risk (settings.get returns undefined for unknown keys)

---

## Summary

### Entity Count: 1
- **ExtendedBreakTrigger**: Core entity with 6 fields, 2 subtypes (time-of-day, break-count)

### State Storage: 2 Layers
- **Persisted**: `extendedBreakTriggers` array in electron-store (JSON)
- **In-Memory**: `lastTriggerEvaluationDate` + `triggeredTodayIds` in BreaksPlanner instance

### Validation Points: 4
1. Field-level validation (format, range, type)
2. Cross-field validation (type-specific required fields)
3. Uniqueness constraint (ID collision check)
4. Data integrity (non-empty duration, valid enum)

### Lifecycle Operations: 4
- Create (with UUID generation + validation)
- Read (single by ID, all triggers)
- Update (validate before persist)
- Delete (by ID with existence check)

### State Machines: 2
- Time-of-Day: 4 states, daily reset cycle
- Break-Count: 4 states, idle reset cycle

Next: Generate API contracts for CRUD operations and trigger evaluation logic.
