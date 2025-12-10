# Settings Contract

**Feature**: Strict Mode Skip Friction  
**Component**: electron-store Settings Schema  
**Date**: December 10, 2025

## Overview

This contract defines the exact schema for all 12 settings fields added to electron-store for the skip friction feature. These settings extend the existing `defaultSettings.js` file.

---

## Schema Definition

### Mini Break Friction Settings

```javascript
{
  // Enable/disable friction for mini breaks
  microbreakSkipFrictionEnabled: {
    type: Boolean,
    default: true,
    description: 'Enable skip friction in strict mode for mini breaks',
    validValues: [true, false],
    uiControl: 'checkbox',
    preferencesSection: 'strictMode'
  },

  // Character length per word
  microbreakSkipFrictionCharLength: {
    type: Integer,
    default: 20,
    description: 'Number of characters per word in friction string',
    validRange: { min: 1, max: 50 },
    uiControl: 'number input',
    preferencesSection: 'strictMode'
  },

  // Enable/disable incremental friction
  microbreakSkipFrictionIncrementalEnabled: {
    type: Boolean,
    default: true,
    description: 'Enable incremental difficulty based on sequential skips',
    validValues: [true, false],
    uiControl: 'checkbox',
    preferencesSection: 'strictMode'
  },

  // Maximum words for incremental friction
  microbreakSkipFrictionMaxWords: {
    type: Integer,
    default: 5,
    description: 'Maximum number of words when incremental friction enabled',
    validRange: { min: 1, max: 20 },
    uiControl: 'number input',
    preferencesSection: 'strictMode'
  },

  // Total skip counter
  microbreakSkipFrictionTotalCount: {
    type: Integer,
    default: 0,
    description: 'Total number of mini breaks skipped using friction',
    validRange: { min: 0, max: Number.MAX_SAFE_INTEGER },
    uiControl: 'readonly display + reset button',
    preferencesSection: 'statistics'
  },

  // Sequential skip counter
  microbreakSkipFrictionSequentialCount: {
    type: Integer,
    default: 0,
    description: 'Sequential mini break skips without completion',
    validRange: { min: 0, max: Number.MAX_SAFE_INTEGER },
    uiControl: 'none (internal only)',
    preferencesSection: 'none'
  }
}
```

### Long Break Friction Settings

```javascript
{
  // Enable/disable friction for long breaks
  breakSkipFrictionEnabled: {
    type: Boolean,
    default: true,
    description: 'Enable skip friction in strict mode for long breaks',
    validValues: [true, false],
    uiControl: 'checkbox',
    preferencesSection: 'strictMode'
  },

  // Character length per word
  breakSkipFrictionCharLength: {
    type: Integer,
    default: 20,
    description: 'Number of characters per word in friction string',
    validRange: { min: 1, max: 50 },
    uiControl: 'number input',
    preferencesSection: 'strictMode'
  },

  // Enable/disable incremental friction
  breakSkipFrictionIncrementalEnabled: {
    type: Boolean,
    default: true,
    description: 'Enable incremental difficulty based on sequential skips',
    validValues: [true, false],
    uiControl: 'checkbox',
    preferencesSection: 'strictMode'
  },

  // Maximum words for incremental friction
  breakSkipFrictionMaxWords: {
    type: Integer,
    default: 5,
    description: 'Maximum number of words when incremental friction enabled',
    validRange: { min: 1, max: 20 },
    uiControl: 'number input',
    preferencesSection: 'strictMode'
  },

  // Total skip counter
  breakSkipFrictionTotalCount: {
    type: Integer,
    default: 0,
    description: 'Total number of long breaks skipped using friction',
    validRange: { min: 0, max: Number.MAX_SAFE_INTEGER },
    uiControl: 'readonly display + reset button',
    preferencesSection: 'statistics'
  },

  // Sequential skip counter
  breakSkipFrictionSequentialCount: {
    type: Integer,
    default: 0,
    description: 'Sequential long break skips without completion',
    validRange: { min: 0, max: Number.MAX_SAFE_INTEGER },
    uiControl: 'none (internal only)',
    preferencesSection: 'none'
  }
}
```

---

## Integration with defaultSettings.js

### File Location
`app/utils/defaultSettings.js`

### Code Addition
Add the following 12 fields to the exported object (alphabetical order preferred):

```javascript
export default {
  // ... existing settings ...
  
  breakSkipFrictionEnabled: true,
  breakSkipFrictionCharLength: 20,
  breakSkipFrictionIncrementalEnabled: true,
  breakSkipFrictionMaxWords: 5,
  breakSkipFrictionTotalCount: 0,
  breakSkipFrictionSequentialCount: 0,
  
  // ... existing settings ...
  
  microbreakSkipFrictionEnabled: true,
  microbreakSkipFrictionCharLength: 20,
  microbreakSkipFrictionIncrementalEnabled: true,
  microbreakSkipFrictionMaxWords: 5,
  microbreakSkipFrictionTotalCount: 0,
  microbreakSkipFrictionSequentialCount: 0,
  
  // ... existing settings ...
}
```

---

## Validation Rules

### Character Length Validation

```javascript
function validateCharLength(value) {
  if (!Number.isInteger(value)) {
    throw new Error('Character length must be an integer')
  }
  if (value < 1 || value > 50) {
    throw new Error('Character length must be between 1 and 50')
  }
  return value
}
```

### Max Words Validation

```javascript
function validateMaxWords(value) {
  if (!Number.isInteger(value)) {
    throw new Error('Maximum words must be an integer')
  }
  if (value < 1 || value > 20) {
    throw new Error('Maximum words must be between 1 and 20')
  }
  return value
}
```

### Counter Validation

```javascript
function validateCounter(value) {
  if (!Number.isInteger(value)) {
    throw new Error('Counter must be an integer')
  }
  if (value < 0) {
    throw new Error('Counter cannot be negative')
  }
  return value
}
```

---

## Settings Usage Patterns

### Reading Settings

```javascript
// In break-renderer.js or microbreak-renderer.js
const isBreak = true // or false for microbreak

const frictionEnabled = await window.settings.get(
  isBreak ? 'breakSkipFrictionEnabled' : 'microbreakSkipFrictionEnabled'
)

const charLength = await window.settings.get(
  isBreak ? 'breakSkipFrictionCharLength' : 'microbreakSkipFrictionCharLength'
)

const incrementalEnabled = await window.settings.get(
  isBreak ? 'breakSkipFrictionIncrementalEnabled' : 'microbreakSkipFrictionIncrementalEnabled'
)

const maxWords = await window.settings.get(
  isBreak ? 'breakSkipFrictionMaxWords' : 'microbreakSkipFrictionMaxWords'
)

const sequentialCount = await window.settings.get(
  isBreak ? 'breakSkipFrictionSequentialCount' : 'microbreakSkipFrictionSequentialCount'
)
```

### Writing Settings (Preferences)

```javascript
// In preferences-renderer.js
async function saveFrictionSettings(breakType, settings) {
  const prefix = breakType === 'break' ? 'break' : 'microbreak'
  
  await window.settings.set(`${prefix}SkipFrictionEnabled`, settings.enabled)
  await window.settings.set(`${prefix}SkipFrictionCharLength`, settings.charLength)
  await window.settings.set(`${prefix}SkipFrictionIncrementalEnabled`, settings.incrementalEnabled)
  await window.settings.set(`${prefix}SkipFrictionMaxWords`, settings.maxWords)
}
```

### Incrementing Counters

```javascript
// In break-renderer.js or microbreak-renderer.js
async function incrementFrictionCounters(isBreak) {
  const totalKey = isBreak ? 'breakSkipFrictionTotalCount' : 'microbreakSkipFrictionTotalCount'
  const seqKey = isBreak ? 'breakSkipFrictionSequentialCount' : 'microbreakSkipFrictionSequentialCount'
  
  const currentTotal = await window.settings.get(totalKey)
  const currentSeq = await window.settings.get(seqKey)
  
  await window.settings.set(totalKey, currentTotal + 1)
  await window.settings.set(seqKey, currentSeq + 1)
}
```

### Resetting Sequential Counter

```javascript
// In break-renderer.js or microbreak-renderer.js
async function resetSequentialCounter(isBreak) {
  const seqKey = isBreak ? 'breakSkipFrictionSequentialCount' : 'microbreakSkipFrictionSequentialCount'
  await window.settings.set(seqKey, 0)
}
```

### Resetting Total Counter (User Action)

```javascript
// In preferences-renderer.js
async function resetTotalCounter(breakType) {
  const totalKey = breakType === 'break' ? 'breakSkipFrictionTotalCount' : 'microbreakSkipFrictionTotalCount'
  await window.settings.set(totalKey, 0)
  
  // Update UI display
  document.getElementById(`${breakType}-total-count`).textContent = '0'
}
```

---

## Setting Dependencies

### Friction Activation Conditions

Friction is active when **ALL** of the following are true:

1. Strict mode is enabled for the break type
   - Mini break: `microbreakStrictMode === true`
   - Long break: `breakStrictMode === true`

2. Friction is enabled for the break type
   - Mini break: `microbreakSkipFrictionEnabled === true`
   - Long break: `breakSkipFrictionEnabled === true`

3. Break is currently active (window is open)

**Pseudo-code**:
```javascript
function isFrictionActive(isBreak) {
  const strictMode = await window.settings.get(
    isBreak ? 'breakStrictMode' : 'microbreakStrictMode'
  )
  const frictionEnabled = await window.settings.get(
    isBreak ? 'breakSkipFrictionEnabled' : 'microbreakSkipFrictionEnabled'
  )
  
  return strictMode && frictionEnabled
}
```

### Incremental Friction Conditions

Incremental friction (multiple words) applies when **ALL** of the following are true:

1. Friction is active (see above)
2. Incremental friction is enabled
   - Mini break: `microbreakSkipFrictionIncrementalEnabled === true`
   - Long break: `breakSkipFrictionIncrementalEnabled === true`

**Word count formula**:
```javascript
function calculateWordCount(isBreak, sequentialCount) {
  const maxWords = await window.settings.get(
    isBreak ? 'breakSkipFrictionMaxWords' : 'microbreakSkipFrictionMaxWords'
  )
  
  return Math.min(1 + sequentialCount, maxWords)
}
```

---

## UI Mapping (Preferences)

### Preferences Section Structure

```html
<!-- Mini Break Friction Settings -->
<div class="section-title">Mini Break Skip Friction</div>

<div class="setting-row">
  <label for="microbreak-friction-enabled">
    <input type="checkbox" id="microbreak-friction-enabled" value="microbreakSkipFrictionEnabled">
    Enable skip friction in strict mode
  </label>
</div>

<div class="setting-row">
  <label for="microbreak-friction-char-length">Character length per word</label>
  <input type="number" id="microbreak-friction-char-length" min="1" max="50" value="20">
</div>

<div class="setting-row">
  <label for="microbreak-friction-incremental">
    <input type="checkbox" id="microbreak-friction-incremental" value="microbreakSkipFrictionIncrementalEnabled">
    Enable incremental friction
  </label>
</div>

<div class="setting-row">
  <label for="microbreak-friction-max-words">Maximum words</label>
  <input type="number" id="microbreak-friction-max-words" min="1" max="20" value="5">
</div>

<div class="setting-row">
  <label>Total mini break skips</label>
  <span id="microbreak-friction-total-count">0</span>
  <button id="reset-microbreak-count">Reset</button>
</div>

<!-- Long Break Friction Settings (same structure with "break" prefix) -->
```

### Preferences JavaScript Bindings

```javascript
// Load settings into UI
async function loadFrictionSettings() {
  // Mini break
  document.getElementById('microbreak-friction-enabled').checked = 
    await window.settings.get('microbreakSkipFrictionEnabled')
  document.getElementById('microbreak-friction-char-length').value = 
    await window.settings.get('microbreakSkipFrictionCharLength')
  document.getElementById('microbreak-friction-incremental').checked = 
    await window.settings.get('microbreakSkipFrictionIncrementalEnabled')
  document.getElementById('microbreak-friction-max-words').value = 
    await window.settings.get('microbreakSkipFrictionMaxWords')
  document.getElementById('microbreak-friction-total-count').textContent = 
    await window.settings.get('microbreakSkipFrictionTotalCount')
  
  // Repeat for long break with 'break' prefix
}

// Save settings from UI
async function saveFrictionSettings() {
  // Mini break
  await window.settings.set('microbreakSkipFrictionEnabled', 
    document.getElementById('microbreak-friction-enabled').checked)
  await window.settings.set('microbreakSkipFrictionCharLength', 
    parseInt(document.getElementById('microbreak-friction-char-length').value))
  await window.settings.set('microbreakSkipFrictionIncrementalEnabled', 
    document.getElementById('microbreak-friction-incremental').checked)
  await window.settings.set('microbreakSkipFrictionMaxWords', 
    parseInt(document.getElementById('microbreak-friction-max-words').value))
  
  // Repeat for long break with 'break' prefix
}
```

---

## Testing Contract

### Settings Persistence Tests

```javascript
// test/settings.js (or new file test/frictionSettings.js)
describe('Friction Settings Persistence', () => {
  it('should persist microbreak friction enabled state', async () => {
    await window.settings.set('microbreakSkipFrictionEnabled', false)
    const value = await window.settings.get('microbreakSkipFrictionEnabled')
    expect(value).toBe(false)
  })
  
  it('should validate character length within range', async () => {
    await expect(() => 
      window.settings.set('microbreakSkipFrictionCharLength', 0)
    ).rejects.toThrow('Character length must be between 1 and 50')
  })
  
  it('should persist counters across restarts', async () => {
    await window.settings.set('microbreakSkipFrictionTotalCount', 10)
    // Simulate app restart (reload settings)
    const value = await window.settings.get('microbreakSkipFrictionTotalCount')
    expect(value).toBe(10)
  })
})
```

---

## Summary

- **12 new settings fields** added to electron-store
- **6 fields per break type** (enabled, charLength, incrementalEnabled, maxWords, totalCount, sequentialCount)
- **Validation enforced** on charLength (1-50), maxWords (1-20), counters (0 to Number.MAX_SAFE_INTEGER)
- **Preferences UI** provides user-facing controls for 5 fields per break type (sequential count is internal)
- **Counters persist** across app restarts (FR-044, FR-045, FR-051)
