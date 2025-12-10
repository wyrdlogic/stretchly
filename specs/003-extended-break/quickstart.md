# Developer Quickstart: Extended Break Triggers

## Overview

This guide provides step-by-step instructions for implementing the Extended Break Triggers feature in Stretchly. Follow these steps in order to maintain code quality and ensure testability.

---

## Prerequisites

- Stretchly development environment set up (Node.js 22.20.0+, Electron 39.0.0+)
- Familiarity with StandardJS code style (no semicolons, 2-space indentation)
- Understanding of Electron IPC and electron-store
- Vitest installed for testing

---

## Implementation Steps

### Step 1: Add Default Setting

**File:** `app/utils/defaultSettings.js`

**Action:** Add `extendedBreakTriggers` to default settings object.

```javascript
export default {
  // ... existing settings ...
  breakPostponableDurationPercent: 30,
  extendedBreakTriggers: [],  // ← Add this line
  mainColor: '#478484',
  // ... remaining settings ...
}
```

**Why:** Ensures all installations have the setting initialized as an empty array.

---

### Step 2: Create Trigger Management Utilities

**File:** `app/utils/extendedBreakTriggers.js` (NEW)

**Action:** Create utility functions for CRUD operations and validation.

```javascript
import { randomUUID } from 'crypto'

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
    throw new Error(`Invalid type: ${config.type}`)
  }

  validateDuration(config.duration)

  const triggers = getTriggers(settings)
  triggers.push(trigger)
  settings.set('extendedBreakTriggers', triggers)

  return trigger
}

export function getTriggers (settings) {
  const triggers = settings.get('extendedBreakTriggers')
  return Array.isArray(triggers) ? triggers : []
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

  const updatedTrigger = { ...triggers[index], ...updates }
  
  // Re-validate after merge
  if (updatedTrigger.type === 'time-of-day') {
    validateTimeOfDay(updatedTrigger.timeOfDay)
  } else if (updatedTrigger.type === 'break-count') {
    validateBreakCount(updatedTrigger.breakCount)
  }
  validateDuration(updatedTrigger.duration)

  triggers[index] = updatedTrigger
  settings.set('extendedBreakTriggers', triggers)

  return updatedTrigger
}

export function deleteTrigger (settings, id) {
  const triggers = getTriggers(settings)
  const filteredTriggers = triggers.filter(t => t.id !== id)

  if (filteredTriggers.length === triggers.length) {
    throw new Error(`Trigger not found: ${id}`)
  }

  settings.set('extendedBreakTriggers', filteredTriggers)
}

function validateTimeOfDay (timeOfDay) {
  const pattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  if (!pattern.test(timeOfDay)) {
    throw new Error(`Invalid time format: ${timeOfDay}. Expected HH:mm (24-hour)`)
  }
}

function validateBreakCount (breakCount) {
  if (!Number.isInteger(breakCount) || breakCount < 2) {
    throw new Error('breakCount must be integer >= 2')
  }
}

function validateDuration (duration) {
  if (!Number.isInteger(duration) || duration <= 0) {
    throw new Error('Duration must be positive integer')
  }
}
```

**Test:** Create `test/extendedBreakTriggers.js` and test each function.

---

### Step 3: Extend BreaksPlanner with Trigger Evaluation

**File:** `app/breaksPlanner.js`

**Action 1:** Add state tracking in constructor.

```javascript
class BreaksPlanner extends EventEmitter {
  constructor (settings) {
    super()
    this.settings = settings
    this.breakNumber = 0
    this.postponesNumber = 0
    this.scheduler = null
    this.isPaused = false
    this.naturalBreaksManager = new NaturalBreaksManager(settings)
    this.dndManager = new DndManager(settings)
    this.appExclusionsManager = new AppExclusionsManager(settings)
    
    // ↓ Add these lines
    this.lastTriggerEvaluationDate = new Date().toDateString()
    this.triggeredTodayIds = new Set()
    // ↑ End addition

    this.on('microbreakStarted', (shouldPlaySound) => {
      // ... existing code ...
    })
```

**Action 2:** Modify `breakStarted` event handler to use dynamic duration.

```javascript
    this.on('breakStarted', (shouldPlaySound) => {
      const interval = this._getBreakDuration()  // ← Change this line
      this.scheduler = new Scheduler(() => this.emit('finishBreak', shouldPlaySound, true), interval, 'finishBreak')
      this.scheduler.plan()
    })
```

**Action 3:** Add trigger evaluation methods at end of class (before `export default`).

```javascript
  _getBreakDuration () {
    const baseDuration = this.settings.get('breakDuration')
    
    // Only apply triggers to long breaks
    if (this._scheduledBreakType !== 'break') {
      return baseDuration
    }
    
    const overrideDuration = this._evaluateExtendedBreakTriggers()
    return overrideDuration || baseDuration
  }

  _evaluateExtendedBreakTriggers () {
    this._resetDailyStateIfNeeded()
    
    const triggers = this.settings.get('extendedBreakTriggers')
    if (!Array.isArray(triggers) || triggers.length === 0) {
      return null
    }
    
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

  _evaluateSingleTrigger (trigger) {
    if (trigger.type === 'time-of-day') {
      return this._evaluateTimeOfDayTrigger(trigger)
    } else if (trigger.type === 'break-count') {
      return this._evaluateBreakCountTrigger(trigger)
    }
    return null
  }

  _evaluateTimeOfDayTrigger (trigger) {
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

  _evaluateBreakCountTrigger (trigger) {
    const shouldBreak = this.settings.get('break')
    const shouldMicrobreak = this.settings.get('microbreak')
    
    if (!shouldBreak || !shouldMicrobreak) {
      return null
    }
    
    const breakInterval = this.settings.get('breakInterval') + 1
    
    // Check if this is a long break
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

  _resetDailyStateIfNeeded () {
    const currentDate = new Date().toDateString()
    
    if (currentDate !== this.lastTriggerEvaluationDate) {
      this.triggeredTodayIds.clear()
      this.lastTriggerEvaluationDate = currentDate
      log.info('Stretchly: daily reset for extended break triggers')
    }
  }
}
```

**Test:** Create tests in `test/breaksPlanner.js` (or separate file) for trigger evaluation logic.

---

### Step 4: Add IPC Handlers

**File:** `app/main.js`

**Action:** Add IPC handlers after other `ipcMain.handle` calls (search for existing handlers).

```javascript
import { createTrigger, getTriggers, updateTrigger, deleteTrigger } from './utils/extendedBreakTriggers.js'

// ... existing code ...

ipcMain.handle('get-extended-break-triggers', () => {
  const triggers = getTriggers(settings)
  return { success: true, data: triggers }
})

ipcMain.handle('create-extended-break-trigger', (event, config) => {
  try {
    const trigger = createTrigger(settings, config)
    return { success: true, data: trigger }
  } catch (err) {
    log.error(`Error creating trigger: ${err.message}`)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('update-extended-break-trigger', (event, { id, updates }) => {
  try {
    const trigger = updateTrigger(settings, id, updates)
    return { success: true, data: trigger }
  } catch (err) {
    log.error(`Error updating trigger: ${err.message}`)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('delete-extended-break-trigger', (event, id) => {
  try {
    deleteTrigger(settings, id)
    return { success: true }
  } catch (err) {
    log.error(`Error deleting trigger: ${err.message}`)
    return { success: false, error: err.message }
  }
})
```

**Test:** Use Electron DevTools console to test IPC calls manually.

---

### Step 5: Add UI to Preferences Window

**File:** `app/preferences.html`

**Action:** Add trigger management section after existing break settings.

```html
<!-- Find the break settings section and add after it -->

<div class="preferences-box">
  <h3 data-i18n="extendedBreakTriggers"></h3>
  <p data-i18n="extendedBreakTriggersDescription" class="description"></p>
  
  <table id="extendedBreakTriggersTable">
    <thead>
      <tr>
        <th data-i18n="triggerEnabled"></th>
        <th data-i18n="triggerType"></th>
        <th data-i18n="triggerCondition"></th>
        <th data-i18n="triggerDuration"></th>
        <th data-i18n="actions"></th>
      </tr>
    </thead>
    <tbody id="extendedBreakTriggersTableBody">
      <!-- Populated dynamically by renderer -->
    </tbody>
  </table>
  
  <button id="addExtendedBreakTrigger" data-i18n="addTrigger"></button>
</div>
```

**File:** `app/css/preferences.css`

**Action:** Add styles for trigger table.

```css
#extendedBreakTriggersTable {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
}

#extendedBreakTriggersTable th,
#extendedBreakTriggersTable td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

#extendedBreakTriggersTable th {
  background-color: var(--color-background-secondary);
  font-weight: bold;
}

.trigger-enabled-checkbox {
  width: 20px;
  height: 20px;
}

.trigger-actions button {
  margin-right: 5px;
}
```

---

### Step 6: Implement Preferences Renderer Logic

**File:** `app/preferences-renderer.js`

**Action:** Add trigger management functions.

```javascript
// Add at end of file

async function loadExtendedBreakTriggers () {
  const result = await ipcRenderer.invoke('get-extended-break-triggers')
  
  if (result.success) {
    renderTriggerTable(result.data)
  }
}

function renderTriggerTable (triggers) {
  const tbody = document.getElementById('extendedBreakTriggersTableBody')
  tbody.innerHTML = ''
  
  if (triggers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;" data-i18n="noTriggersConfigured"></td></tr>'
    return
  }
  
  for (const trigger of triggers) {
    const row = document.createElement('tr')
    
    // Enabled checkbox
    const enabledCell = document.createElement('td')
    const enabledCheckbox = document.createElement('input')
    enabledCheckbox.type = 'checkbox'
    enabledCheckbox.checked = trigger.enabled
    enabledCheckbox.className = 'trigger-enabled-checkbox'
    enabledCheckbox.addEventListener('change', async () => {
      await updateTriggerEnabled(trigger.id, enabledCheckbox.checked)
    })
    enabledCell.appendChild(enabledCheckbox)
    
    // Type
    const typeCell = document.createElement('td')
    typeCell.textContent = trigger.type === 'time-of-day' ? 'Time of Day' : 'Break Count'
    
    // Condition
    const conditionCell = document.createElement('td')
    conditionCell.textContent = trigger.type === 'time-of-day' 
      ? trigger.timeOfDay 
      : `Every ${trigger.breakCount} breaks`
    
    // Duration
    const durationCell = document.createElement('td')
    durationCell.textContent = `${trigger.duration / 60000} min`
    
    // Actions
    const actionsCell = document.createElement('td')
    actionsCell.className = 'trigger-actions'
    
    const editButton = document.createElement('button')
    editButton.textContent = 'Edit'
    editButton.addEventListener('click', () => editTrigger(trigger))
    
    const deleteButton = document.createElement('button')
    deleteButton.textContent = 'Delete'
    deleteButton.addEventListener('click', async () => {
      if (confirm('Delete this trigger?')) {
        await deleteTriggerById(trigger.id)
      }
    })
    
    actionsCell.appendChild(editButton)
    actionsCell.appendChild(deleteButton)
    
    row.appendChild(enabledCell)
    row.appendChild(typeCell)
    row.appendChild(conditionCell)
    row.appendChild(durationCell)
    row.appendChild(actionsCell)
    
    tbody.appendChild(row)
  }
}

async function updateTriggerEnabled (id, enabled) {
  const result = await ipcRenderer.invoke('update-extended-break-trigger', {
    id,
    updates: { enabled }
  })
  
  if (!result.success) {
    alert(`Error: ${result.error}`)
    loadExtendedBreakTriggers()  // Reload to reset checkbox
  }
}

async function deleteTriggerById (id) {
  const result = await ipcRenderer.invoke('delete-extended-break-trigger', id)
  
  if (result.success) {
    loadExtendedBreakTriggers()
  } else {
    alert(`Error: ${result.error}`)
  }
}

function editTrigger (trigger) {
  // TODO: Show modal dialog for editing
  // For now, simple prompt
  const newDuration = prompt('Enter new duration (minutes):', trigger.duration / 60000)
  
  if (newDuration !== null) {
    updateTriggerDuration(trigger.id, parseInt(newDuration) * 60000)
  }
}

async function updateTriggerDuration (id, duration) {
  const result = await ipcRenderer.invoke('update-extended-break-trigger', {
    id,
    updates: { duration }
  })
  
  if (result.success) {
    loadExtendedBreakTriggers()
  } else {
    alert(`Error: ${result.error}`)
  }
}

document.getElementById('addExtendedBreakTrigger').addEventListener('click', () => {
  // TODO: Show modal dialog for creating new trigger
  // For now, simple prompts
  const type = prompt('Type (time-of-day or break-count):')
  
  if (type !== 'time-of-day' && type !== 'break-count') {
    alert('Invalid type')
    return
  }
  
  const config = { type }
  
  if (type === 'time-of-day') {
    config.timeOfDay = prompt('Time (HH:mm, 24-hour):')
  } else {
    config.breakCount = parseInt(prompt('Break count (minimum 2):'))
  }
  
  config.duration = parseInt(prompt('Duration (minutes):')) * 60000
  
  createNewTrigger(config)
})

async function createNewTrigger (config) {
  const result = await ipcRenderer.invoke('create-extended-break-trigger', config)
  
  if (result.success) {
    loadExtendedBreakTriggers()
  } else {
    alert(`Error: ${result.error}`)
  }
}

// Call on preferences window load
document.addEventListener('DOMContentLoaded', () => {
  // ... existing initialization ...
  loadExtendedBreakTriggers()
})
```

---

### Step 7: Add i18n Translations

**File:** `app/locales/en.json`

**Action:** Add translation keys for UI elements.

```json
{
  "extendedBreakTriggers": "Extended Break Triggers",
  "extendedBreakTriggersDescription": "Configure conditions that extend your long break duration. You can set time-based triggers (e.g., longer break at 2 PM) or count-based triggers (e.g., every 3rd break is longer).",
  "triggerEnabled": "Enabled",
  "triggerType": "Type",
  "triggerCondition": "Condition",
  "triggerDuration": "Duration",
  "actions": "Actions",
  "addTrigger": "Add Trigger",
  "noTriggersConfigured": "No triggers configured. Click 'Add Trigger' to create one."
}
```

**Note:** Repeat for other locale files as needed.

---

### Step 8: Write Tests

**File:** `test/extendedBreakTriggers.js` (NEW)

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { createTrigger, getTriggers, updateTrigger, deleteTrigger } from '../app/utils/extendedBreakTriggers.js'

describe('Extended Break Triggers', () => {
  let mockSettings
  
  beforeEach(() => {
    const store = {}
    mockSettings = {
      get: (key) => store[key],
      set: (key, value) => { store[key] = value }
    }
    mockSettings.set('extendedBreakTriggers', [])
  })
  
  describe('createTrigger', () => {
    it('creates time-of-day trigger with valid config', () => {
      const trigger = createTrigger(mockSettings, {
        type: 'time-of-day',
        timeOfDay: '14:00',
        duration: 600000
      })
      
      expect(trigger.id).toBeDefined()
      expect(trigger.enabled).toBe(true)
      expect(trigger.type).toBe('time-of-day')
      expect(trigger.timeOfDay).toBe('14:00')
      expect(trigger.breakCount).toBe(null)
      expect(trigger.duration).toBe(600000)
      
      const stored = getTriggers(mockSettings)
      expect(stored.length).toBe(1)
      expect(stored[0].id).toBe(trigger.id)
    })
    
    it('throws error for invalid time format', () => {
      expect(() => {
        createTrigger(mockSettings, {
          type: 'time-of-day',
          timeOfDay: '25:00',
          duration: 600000
        })
      }).toThrow('Invalid time format')
    })
    
    it('creates break-count trigger with valid config', () => {
      const trigger = createTrigger(mockSettings, {
        type: 'break-count',
        breakCount: 3,
        duration: 900000
      })
      
      expect(trigger.type).toBe('break-count')
      expect(trigger.breakCount).toBe(3)
      expect(trigger.timeOfDay).toBe(null)
    })
    
    it('throws error for breakCount < 2', () => {
      expect(() => {
        createTrigger(mockSettings, {
          type: 'break-count',
          breakCount: 1,
          duration: 600000
        })
      }).toThrow('breakCount must be integer >= 2')
    })
  })
  
  describe('updateTrigger', () => {
    it('updates trigger duration', () => {
      const trigger = createTrigger(mockSettings, {
        type: 'time-of-day',
        timeOfDay: '14:00',
        duration: 600000
      })
      
      const updated = updateTrigger(mockSettings, trigger.id, { duration: 900000 })
      
      expect(updated.duration).toBe(900000)
      expect(updated.timeOfDay).toBe('14:00')  // Unchanged
    })
    
    it('throws error for non-existent ID', () => {
      expect(() => {
        updateTrigger(mockSettings, 'fake-id', { duration: 900000 })
      }).toThrow('Trigger not found')
    })
  })
  
  describe('deleteTrigger', () => {
    it('removes trigger from settings', () => {
      const trigger = createTrigger(mockSettings, {
        type: 'time-of-day',
        timeOfDay: '14:00',
        duration: 600000
      })
      
      expect(getTriggers(mockSettings).length).toBe(1)
      
      deleteTrigger(mockSettings, trigger.id)
      
      expect(getTriggers(mockSettings).length).toBe(0)
    })
  })
})
```

**File:** `test/breaksPlanner.js` (extend existing or create new)

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import BreaksPlanner from '../app/breaksPlanner.js'

describe('BreaksPlanner - Extended Break Triggers', () => {
  let planner
  let mockSettings
  
  beforeEach(() => {
    const store = {
      microbreak: true,
      break: true,
      breakInterval: 2,
      microbreakDuration: 20000,
      breakDuration: 300000,
      extendedBreakTriggers: []
    }
    
    mockSettings = {
      get: (key) => store[key],
      set: (key, value) => { store[key] = value }
    }
    
    planner = new BreaksPlanner(mockSettings)
  })
  
  it('returns base duration when no triggers configured', () => {
    planner.breakNumber = 3  // Long break
    const duration = planner._getBreakDuration()
    expect(duration).toBe(300000)
  })
  
  it('applies time-of-day trigger when time matches', () => {
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    
    mockSettings.set('extendedBreakTriggers', [{
      id: 'test-id',
      enabled: true,
      type: 'time-of-day',
      timeOfDay: currentTime,
      breakCount: null,
      duration: 600000
    }])
    
    planner.breakNumber = 3
    const duration = planner._getBreakDuration()
    expect(duration).toBe(600000)
  })
  
  it('does not trigger twice on same day', () => {
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    
    mockSettings.set('extendedBreakTriggers', [{
      id: 'test-id',
      enabled: true,
      type: 'time-of-day',
      timeOfDay: currentTime,
      breakCount: null,
      duration: 600000
    }])
    
    planner.breakNumber = 3
    expect(planner._getBreakDuration()).toBe(600000)  // First trigger
    
    planner.breakNumber = 6
    expect(planner._getBreakDuration()).toBe(300000)  // Second break same day - no trigger
  })
})
```

---

### Step 9: Run Linter and Tests

```powershell
npm run lint
npm test
```

Fix any StandardJS violations and ensure all tests pass.

---

### Step 10: Manual Testing Checklist

- [ ] Create time-of-day trigger via preferences UI
- [ ] Verify trigger appears in table
- [ ] Wait for configured time, verify break extends
- [ ] Check electron-log for trigger activation message
- [ ] Verify trigger doesn't fire twice in same day
- [ ] Restart app, verify trigger fires again next day
- [ ] Create break-count trigger (e.g., every 3rd break)
- [ ] Take 3 consecutive long breaks, verify 3rd extends
- [ ] Test idle detection cancels extended break
- [ ] Verify break-count resets after idle
- [ ] Test multiple triggers (longest duration wins)
- [ ] Disable trigger, verify it doesn't fire
- [ ] Edit trigger duration, verify changes persist
- [ ] Delete trigger, verify it's removed

---

## Code Style Reminders

1. **No semicolons** (StandardJS)
2. **2-space indentation** (not tabs)
3. **Single quotes** for strings (not double quotes)
4. **ES modules** with explicit `.js` extensions in imports
5. **Arrow functions** preferred over function declarations
6. **Template literals** for string interpolation
7. **Avoid comments** - prefer self-explanatory code

---

## Common Pitfalls

### Pitfall 1: Time Matching Precision
**Problem:** Using seconds in time matching causes misses.
**Solution:** Only compare hours and minutes (HH:mm format).

### Pitfall 2: Break Number Calculation
**Problem:** Incorrect calculation of consecutive long breaks.
**Solution:** Use `Math.floor(breakNumber / breakInterval)` to get consecutive count.

### Pitfall 3: Daily Reset Timing
**Problem:** Time zone issues with midnight detection.
**Solution:** Use `toDateString()` which handles local time automatically.

### Pitfall 4: Microbreak Extension
**Problem:** Accidentally applying triggers to microbreaks.
**Solution:** Always check `this._scheduledBreakType === 'break'` before evaluation.

---

## Debugging Tips

1. **Enable verbose logging:** Check `~/.config/Stretchly/log.log` for trigger activation messages
2. **Inspect settings file:** `~/.config/Stretchly/config.json` shows persisted triggers
3. **Use Electron DevTools:** `Ctrl+Shift+I` in preferences window to test IPC calls
4. **Mock time in tests:** Use `vi.useFakeTimers()` to test time-of-day logic
5. **Check triggeredTodayIds:** Add temporary log in `_resetDailyStateIfNeeded()` to debug state

---

## Next Steps After Implementation

1. **User Documentation:** Update README with feature description
2. **Changelog:** Add entry to CHANGELOG.md
3. **Release Notes:** Document new feature for next version
4. **Localization:** Translate UI strings to all supported languages
5. **Accessibility:** Test keyboard navigation in trigger management UI
6. **Performance:** Profile trigger evaluation on large trigger arrays (100+ triggers)

---

## Resources

- [Electron IPC Documentation](https://www.electronjs.org/docs/latest/api/ipc-main)
- [electron-store Documentation](https://github.com/sindresorhus/electron-store)
- [Vitest Documentation](https://vitest.dev/)
- [StandardJS Style Guide](https://standardjs.com/)
- [Stretchly Constitution](.specify/memory/constitution.md)

---

**Estimated Implementation Time:** 6-8 hours for experienced developer

**Complexity Level:** Medium (requires understanding of Electron, event-driven architecture, and time-based logic)

**Priority:** Implement in order - missing steps will break functionality.
