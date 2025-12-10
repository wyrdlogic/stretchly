# Quickstart Implementation Guide

**Feature**: Strict Mode Skip Friction  
**Target Audience**: Developers implementing this feature  
**Estimated Time**: 8-12 hours  
**Date**: December 10, 2025

## Overview

This guide provides a step-by-step implementation path for adding skip friction to Stretchly's strict mode. Follow steps sequentially for systematic progress.

---

## Prerequisites

- [x] Feature specification reviewed (`specs/002-strict-mode-password/spec.md`)
- [x] Implementation plan reviewed (`specs/002-strict-mode-password/plan.md`)
- [x] Research decisions understood (`specs/002-strict-mode-password/research.md`)
- [x] Data model understood (`specs/002-strict-mode-password/data-model.md`)
- [x] Development environment setup (Node 22.20.0, npm installed)
- [x] Stretchly repository cloned and dependencies installed (`npm install`)

---

## Implementation Phases

### Phase 1: Settings Foundation (Estimated: 1-2 hours)

**Goal**: Add all 12 friction settings to electron-store with defaults.

#### Step 1.1: Update Default Settings

**File**: `app/utils/defaultSettings.js`

**Action**: Add 12 new settings to the exported object.

```javascript
export default {
  // ... existing settings ...
  
  // Mini break friction settings
  microbreakSkipFrictionEnabled: true,
  microbreakSkipFrictionCharLength: 20,
  microbreakSkipFrictionIncrementalEnabled: true,
  microbreakSkipFrictionMaxWords: 5,
  microbreakSkipFrictionTotalCount: 0,
  microbreakSkipFrictionSequentialCount: 0,
  
  // Long break friction settings
  breakSkipFrictionEnabled: true,
  breakSkipFrictionCharLength: 20,
  breakSkipFrictionIncrementalEnabled: true,
  breakSkipFrictionMaxWords: 5,
  breakSkipFrictionTotalCount: 0,
  breakSkipFrictionSequentialCount: 0,
  
  // ... existing settings ...
}
```

**Verification**:
```bash
npm start
# Open DevTools in preferences window
# Run: await window.settings.get('microbreakSkipFrictionEnabled')
# Expected: true
```

---

#### Step 1.2: Add Localization Keys

**File**: `app/locales/en.json`

**Action**: Add i18n keys for friction UI.

```json
{
  "preferences": {
    "skipFriction": {
      "miniBreakTitle": "Mini Break Skip Friction",
      "longBreakTitle": "Long Break Skip Friction",
      "enabled": "Enable skip friction in strict mode",
      "charLength": "Character length per word",
      "incrementalEnabled": "Enable incremental friction",
      "maxWords": "Maximum words",
      "totalCount": "Total skips",
      "resetCount": "Reset counter"
    }
  },
  "main": {
    "frictionStats": "Total skips: {{count}}",
    "frictionSequential": "Sequential: {{count}}",
    "frictionSkipButton": "Skip Break",
    "frictionCancelButton": "Continue Break"
  }
}
```

**Verification**: Strings will be used in later phases.

---

### Phase 2: Random String Generation (Estimated: 1 hour)

**Goal**: Create utility module for generating random friction strings.

#### Step 2.1: Create Friction Generator Module

**File**: `app/utils/frictionGenerator.js` (NEW FILE)

**Action**: Implement random string generation with balanced character distribution.

```javascript
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
  // Fisher-Yates shuffle
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
  
  // Distribute characters across classes
  chars.push(...getRandomChars(NUMBERS, charsPerClass + (remainder > 0 ? 1 : 0)))
  chars.push(...getRandomChars(LOWERCASE, charsPerClass + (remainder > 1 ? 1 : 0)))
  chars.push(...getRandomChars(UPPERCASE, charsPerClass + (remainder > 2 ? 1 : 0)))
  chars.push(...getRandomChars(SPECIAL, charsPerClass))
  
  // Shuffle to prevent predictable patterns
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
```

**Verification**:
```javascript
import { generateRandomString, generateFrictionStrings } from './frictionGenerator.js'

// Test single string
const str = generateRandomString(20)
console.log(str) // Should be 20 chars with mix of all classes

// Test multiple words
const words = generateFrictionStrings(20, 2, 5, true)
console.log(words) // Should be array of 3 strings (1 + sequentialCount)
```

---

#### Step 2.2: Create Unit Tests

**File**: `test/frictionGenerator.js` (NEW FILE)

**Action**: Add comprehensive tests for string generation.

```javascript
import { describe, it, expect } from 'vitest'
import { generateRandomString, generateFrictionStrings } from '../app/utils/frictionGenerator.js'

describe('generateRandomString', () => {
  it('should generate string of specified length', () => {
    const str = generateRandomString(20)
    expect(str).toHaveLength(20)
  })
  
  it('should include numbers', () => {
    const str = generateRandomString(20)
    expect(str).toMatch(/[0-9]/)
  })
  
  it('should include lowercase letters', () => {
    const str = generateRandomString(20)
    expect(str).toMatch(/[a-z]/)
  })
  
  it('should include uppercase letters', () => {
    const str = generateRandomString(20)
    expect(str).toMatch(/[A-Z]/)
  })
  
  it('should include special characters', () => {
    const str = generateRandomString(20)
    expect(str).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/)
  })
  
  it('should throw error for invalid length', () => {
    expect(() => generateRandomString(0)).toThrow()
    expect(() => generateRandomString(101)).toThrow()
  })
})

describe('generateFrictionStrings', () => {
  it('should return single string when incremental disabled', () => {
    const words = generateFrictionStrings(20, 5, 5, false)
    expect(words).toHaveLength(1)
    expect(words[0]).toHaveLength(20)
  })
  
  it('should return multiple strings based on sequential count', () => {
    const words = generateFrictionStrings(20, 2, 5, true)
    expect(words).toHaveLength(3) // 1 + sequentialCount
  })
  
  it('should cap word count at maximum', () => {
    const words = generateFrictionStrings(20, 10, 5, true)
    expect(words).toHaveLength(5) // Capped at maxWords
  })
})
```

**Verification**:
```bash
npm test frictionGenerator
# All tests should pass
```

---

### Phase 3: Update `canSkip()` Utility (Estimated: 30 minutes)

**Goal**: Extend existing skip logic to support friction.

#### Step 3.1: Modify `canSkip()` Function

**File**: `app/utils/utils.js`

**Action**: Add friction parameters to function signature and logic.

**Find this function** (around line 56):
```javascript
function canSkip (strictMode, postpone, passedPercent, postponePercent, skipDelayEnabled = false, skipDelayPassed = false) {
```

**Replace with**:
```javascript
function canSkip (strictMode, postpone, passedPercent, postponePercent, skipDelayEnabled = false, skipDelayPassed = false, frictionEnabled = false, frictionCompleted = false) {
  if (strictMode) {
    if (frictionEnabled && !frictionCompleted) {
      return false // Friction not completed
    }
    if (!frictionEnabled) {
      return false // Strict mode without friction = no skip (current behavior)
    }
    // Friction enabled and completed = allow skip
    return true
  }
  
  // Non-strict mode logic (unchanged)
  if (skipDelayEnabled && !skipDelayPassed) {
    return false
  }
  
  if (!postpone) {
    return true
  }
  
  return passedPercent >= postponePercent
}
```

**Verification**: Existing tests should still pass (backward compatible with defaults).

---

#### Step 3.2: Add Tests for Friction Logic

**File**: `test/utils.js`

**Action**: Add test cases for new friction parameters.

```javascript
describe('canSkip with friction', () => {
  it('should prevent skip when friction enabled but not completed', () => {
    const result = canSkip(true, false, 100, 50, false, false, true, false)
    expect(result).toBe(false)
  })
  
  it('should allow skip when friction enabled and completed', () => {
    const result = canSkip(true, false, 100, 50, false, false, true, true)
    expect(result).toBe(true)
  })
  
  it('should prevent skip when strict mode enabled without friction', () => {
    const result = canSkip(true, false, 100, 50, false, false, false, false)
    expect(result).toBe(false) // Existing behavior preserved
  })
  
  it('should allow skip in non-strict mode regardless of friction', () => {
    const result = canSkip(false, false, 100, 50, false, false, false, false)
    expect(result).toBe(true)
  })
})
```

**Verification**:
```bash
npm test utils
# New tests should pass, existing tests should still pass
```

---

### Phase 4: Friction UI Components (Estimated: 3-4 hours)

**Goal**: Build the character-by-character input interface.

#### Step 4.1: Add CSS Styles

**File**: `app/css/break.css`

**Action**: Add friction interface styles at end of file.

```css
/* Skip Friction Interface */
.friction-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.friction-stats {
  display: flex;
  gap: 3rem;
  font-size: 1.2rem;
  color: var(--text-color);
}

.stat-item {
  display: flex;
  gap: 0.5rem;
}

.stat-value {
  font-weight: bold;
  color: var(--accent-color);
}

.friction-grid {
  display: flex;
  gap: 2rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.friction-word {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.friction-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, 3rem);
  gap: 0.5rem;
}

.word-spacer {
  width: 100%;
  height: 1rem;
}

.friction-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.1s ease;
}

.friction-column.empty {
  background-color: transparent;
  border: 2px dashed var(--border-color);
}

.friction-column.correct {
  background-color: var(--correct-green);
  border: 2px solid var(--correct-green-dark);
}

.friction-column.incorrect {
  background-color: var(--incorrect-red);
  border: 2px solid var(--incorrect-red-dark);
}

.target-char {
  font-family: 'Courier New', monospace;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-color);
  user-select: none;
}

.input-char {
  width: 2rem;
  height: 2rem;
  font-family: 'Courier New', monospace;
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  border: none;
  background: transparent;
  color: var(--input-text-color);
  outline: none;
  caret-color: var(--accent-color);
}

.friction-actions {
  display: flex;
  gap: 1rem;
}

.friction-btn {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.friction-btn:hover {
  transform: translateY(-2px);
}

.friction-btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.friction-btn-secondary {
  background-color: var(--secondary-color);
  color: var(--text-color);
}
```

**File**: `app/css/color-scheme.css`

**Action**: Add theme colors at end of `:root` and `[data-theme='dark']` blocks.

```css
:root {
  /* ... existing colors ... */
  
  /* Friction Interface Colors (Light Theme) */
  --correct-green: #28a745;
  --correct-green-dark: #218838;
  --incorrect-red: #dc3545;
  --incorrect-red-dark: #c82333;
  --border-color: #d1d5db;
  --input-text-color: #1f2937;
}

[data-theme='dark'] {
  /* ... existing colors ... */
  
  /* Friction Interface Colors (Dark Theme) */
  --correct-green: #3fb950;
  --correct-green-dark: #2ea043;
  --incorrect-red: #f85149;
  --incorrect-red-dark: #da3633;
  --border-color: #4b5563;
  --input-text-color: #e5e7eb;
}
```

**Verification**: Colors will be used when UI is rendered in next step.

---

#### Step 4.2: Add HTML Structure

**File**: `app/break.html`

**Action**: Add friction interface container inside break content area (find `<div id="break-content">` and add before closing tag).

```html
<!-- Existing break content -->
<div id="break-content">
  <!-- ... existing timer, message, etc. ... -->
  
  <!-- NEW: Friction Interface (hidden by default) -->
  <div id="friction-interface" class="friction-container" style="display: none;">
    <div class="friction-stats">
      <span class="stat-item">
        <span class="stat-label" data-i18n="main.frictionStats"></span>
        <span id="friction-total-count" class="stat-value">0</span>
      </span>
      <span class="stat-item">
        <span class="stat-label" data-i18n="main.frictionSequential"></span>
        <span id="friction-sequential-count" class="stat-value">0</span>
      </span>
    </div>
    
    <div class="friction-grid">
      <!-- Generated dynamically -->
    </div>
    
    <div class="friction-actions">
      <button id="friction-skip-btn" class="friction-btn friction-btn-primary" style="display: none;" data-i18n="main.frictionSkipButton">Skip Break</button>
      <button id="friction-cancel-btn" class="friction-btn friction-btn-secondary" data-i18n="main.frictionCancelButton">Continue Break</button>
    </div>
  </div>
  
  <!-- ... existing buttons ... -->
</div>
```

**File**: `app/microbreak.html`

**Action**: Add identical friction interface HTML (same structure as above).

**Verification**: Interface will be visible when JavaScript renders it in next phase.

---

#### Step 4.3: Add Friction UI JavaScript

**File**: `app/break-renderer.js`

**Action**: Add friction UI generation and validation functions.

**Add these functions before the existing `init()` function**:

```javascript
import { generateFrictionStrings } from './utils/frictionGenerator.js'

function generateFrictionUI (targetStrings, totalCount, sequentialCount) {
  document.getElementById('friction-total-count').textContent = totalCount
  document.getElementById('friction-sequential-count').textContent = sequentialCount
  
  const grid = document.querySelector('.friction-grid')
  grid.innerHTML = ''
  
  let globalIndex = 0
  const totalLength = targetStrings.reduce((sum, word) => sum + word.length, 0)
  
  targetStrings.forEach((word, wordIndex) => {
    const wordContainer = document.createElement('div')
    wordContainer.className = 'friction-word'
    
    // Row 1: Target characters
    const targetRow = document.createElement('div')
    targetRow.className = 'friction-row target-row'
    
    // Row 2: Input fields
    const inputRow = document.createElement('div')
    inputRow.className = 'friction-row input-row'
    
    for (let i = 0; i < word.length; i++) {
      // Create target column
      const targetColumn = document.createElement('div')
      targetColumn.className = 'friction-column empty'
      targetColumn.dataset.index = globalIndex
      
      const targetChar = document.createElement('div')
      targetChar.className = 'target-char'
      targetChar.textContent = word[i]
      targetColumn.appendChild(targetChar)
      targetRow.appendChild(targetColumn)
      
      // Create input column
      const inputColumn = document.createElement('div')
      inputColumn.className = 'friction-column empty'
      inputColumn.dataset.index = globalIndex
      
      const inputChar = document.createElement('input')
      inputChar.type = 'text'
      inputChar.className = 'input-char'
      inputChar.maxLength = 1
      inputChar.autocomplete = 'off'
      inputChar.spellcheck = false
      inputChar.dataset.index = globalIndex
      inputChar.setAttribute('aria-label', `Character ${globalIndex + 1} of ${totalLength}`)
      inputColumn.appendChild(inputChar)
      inputRow.appendChild(inputColumn)
      
      globalIndex++
    }
    
    wordContainer.appendChild(targetRow)
    wordContainer.appendChild(inputRow)
    grid.appendChild(wordContainer)
    
    // Add spacer between words (except after last word)
    if (wordIndex < targetStrings.length - 1) {
      const spacer = document.createElement('div')
      spacer.className = 'word-spacer'
      grid.appendChild(spacer)
    }
  })
}
```
      inputChar.type = 'text'
      inputChar.className = 'input-char'
      inputChar.maxLength = 1
      inputChar.autocomplete = 'off'
      inputChar.spellcheck = false
      inputChar.dataset.index = globalIndex
      inputChar.setAttribute('aria-label', `Character ${globalIndex + 1} of ${totalLength}`)
      
      column.appendChild(targetChar)
      column.appendChild(inputChar)
      wordContainer.appendChild(column)
      
      globalIndex++
    }
    
    grid.appendChild(wordContainer)
    
    if (wordIndex < targetStrings.length - 1) {
      const spacer = document.createElement('div')
      spacer.className = 'word-spacer'
      grid.appendChild(spacer)
    }
  })
}

function setupFrictionValidation (targetStrings) {
  const flatTarget = targetStrings.join('')
  const validationState = new Array(flatTarget.length).fill(false)
  
  const inputs = document.querySelectorAll('.input-char')
  const skipButton = document.getElementById('friction-skip-btn')
  
  inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const column = e.target.closest('.friction-column')
      const enteredChar = e.target.value
      const targetChar = flatTarget[index]
      
      const isCorrect = enteredChar === targetChar
      validationState[index] = isCorrect
      
      column.classList.remove('empty', 'correct', 'incorrect')
      if (enteredChar === '') {
        column.classList.add('empty')
        validationState[index] = false
      } else if (isCorrect) {
        column.classList.add('correct')
      } else {
        column.classList.add('incorrect')
      }
      
      const allCorrect = validationState.every(v => v === true)
      skipButton.style.display = allCorrect ? 'block' : 'none'
      
      if (isCorrect && index < inputs.length - 1) {
        inputs[index + 1].focus()
      }
    })
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
        inputs[index - 1].focus()
      }
    })
  })
  
  if (inputs.length > 0) {
    inputs[0].focus()
  }
}

async function showFrictionInterface () {
  const isBreak = true
  const frictionEnabled = await window.settings.get('breakSkipFrictionEnabled')
  const charLength = await window.settings.get('breakSkipFrictionCharLength')
  const incrementalEnabled = await window.settings.get('breakSkipFrictionIncrementalEnabled')
  const maxWords = await window.settings.get('breakSkipFrictionMaxWords')
  const sequentialCount = await window.settings.get('breakSkipFrictionSequentialCount')
  const totalCount = await window.settings.get('breakSkipFrictionTotalCount')
  
  const targetStrings = generateFrictionStrings(charLength, sequentialCount, maxWords, incrementalEnabled)
  
  generateFrictionUI(targetStrings, totalCount, sequentialCount)
  setupFrictionValidation(targetStrings)
  
  document.getElementById('friction-interface').style.display = 'flex'
  document.getElementById('break-buttons').style.display = 'none'
  
  return { targetStrings }
}

async function handleFrictionSkip () {
  const totalCount = await window.settings.get('breakSkipFrictionTotalCount')
  const sequentialCount = await window.settings.get('breakSkipFrictionSequentialCount')
  
  await window.settings.set('breakSkipFrictionTotalCount', totalCount + 1)
  await window.settings.set('breakSkipFrictionSequentialCount', sequentialCount + 1)
  
  window.close()
}

async function handleFrictionCancel () {
  document.getElementById('friction-interface').style.display = 'none'
  document.getElementById('break-buttons').style.display = 'flex'
}
```

**Then modify the existing skip button handler**:

Find the existing skip button click handler and wrap it:

```javascript
// Find this (approximate location):
skipButton.addEventListener('click', async () => {
  // existing skip logic
})

// Replace with:
skipButton.addEventListener('click', async () => {
  const strictMode = await window.settings.get('breakStrictMode')
  const frictionEnabled = await window.settings.get('breakSkipFrictionEnabled')
  
  if (strictMode && frictionEnabled) {
    await showFrictionInterface()
    
    document.getElementById('friction-skip-btn').addEventListener('click', handleFrictionSkip, { once: true })
    document.getElementById('friction-cancel-btn').addEventListener('click', handleFrictionCancel, { once: true })
  } else {
    // Existing skip logic
    window.close()
  }
})
```

**File**: `app/microbreak-renderer.js`

**Action**: Apply identical changes as above (replace `'break'` prefixes with `'microbreak'`).

**Verification**:
```bash
npm start
# Enable strict mode and friction in preferences
# Wait for break to trigger
# Click "Skip" → Friction interface should appear
# Type characters → Visual feedback (green/red) should appear
# Complete string → Skip button should appear
```

---

### Phase 5: Counter Reset on Break Completion (Estimated: 30 minutes)

**Goal**: Reset sequential counter when break completes normally.

#### Step 5.1: Add Reset Logic

**File**: `app/break-renderer.js`

**Action**: Find the break completion logic (when timer reaches 0 or user finishes break normally).

**Find the function that handles break completion** (might be in `finishBreak()` or similar):

```javascript
async function finishBreak () {
  // Reset sequential counter (break completed without skip)
  await window.settings.set('breakSkipFrictionSequentialCount', 0)
  
  // ... existing completion logic ...
  window.close()
}
```

**File**: `app/microbreak-renderer.js`

**Action**: Add identical reset logic for microbreaks.

```javascript
async function finishMicrobreak () {
  await window.settings.set('microbreakSkipFrictionSequentialCount', 0)
  window.close()
}
```

**Verification**:
```bash
# Let a break complete without skipping
# Check sequential counter in preferences (should be 0)
```

---

### Phase 6: Preferences UI (Estimated: 2-3 hours)

**Goal**: Add friction settings to preferences window.

#### Step 6.1: Add HTML Controls

**File**: `app/preferences.html`

**Action**: Find the strict mode section (around line 264-276) and add friction settings below.

```html
<!-- Existing Strict Mode Section -->
<div class="section-title">Strict Mode</div>
<!-- ... existing strict mode checkboxes ... -->

<!-- NEW: Mini Break Friction Settings -->
<div class="section-title" data-i18n="preferences.skipFriction.miniBreakTitle">Mini Break Skip Friction</div>

<div class="setting-row">
  <label for="microbreak-friction-enabled">
    <input type="checkbox" id="microbreak-friction-enabled" value="microbreakSkipFrictionEnabled">
    <span data-i18n="preferences.skipFriction.enabled">Enable skip friction in strict mode</span>
  </label>
</div>

<div class="setting-row">
  <label for="microbreak-friction-char-length" data-i18n="preferences.skipFriction.charLength">Character length per word</label>
  <input type="number" id="microbreak-friction-char-length" min="1" max="50" value="20">
</div>

<div class="setting-row">
  <label for="microbreak-friction-incremental">
    <input type="checkbox" id="microbreak-friction-incremental" value="microbreakSkipFrictionIncrementalEnabled">
    <span data-i18n="preferences.skipFriction.incrementalEnabled">Enable incremental friction</span>
  </label>
</div>

<div class="setting-row">
  <label for="microbreak-friction-max-words" data-i18n="preferences.skipFriction.maxWords">Maximum words</label>
  <input type="number" id="microbreak-friction-max-words" min="1" max="20" value="5">
</div>

<div class="setting-row">
  <label data-i18n="preferences.skipFriction.totalCount">Total skips</label>
  <span id="microbreak-friction-total-count" class="stat-display">0</span>
  <button id="reset-microbreak-count" data-i18n="preferences.skipFriction.resetCount">Reset</button>
</div>

<!-- NEW: Long Break Friction Settings -->
<div class="section-title" data-i18n="preferences.skipFriction.longBreakTitle">Long Break Skip Friction</div>

<!-- Repeat above structure with "break-" prefix instead of "microbreak-" -->
<div class="setting-row">
  <label for="break-friction-enabled">
    <input type="checkbox" id="break-friction-enabled" value="breakSkipFrictionEnabled">
    <span data-i18n="preferences.skipFriction.enabled">Enable skip friction in strict mode</span>
  </label>
</div>

<div class="setting-row">
  <label for="break-friction-char-length" data-i18n="preferences.skipFriction.charLength">Character length per word</label>
  <input type="number" id="break-friction-char-length" min="1" max="50" value="20">
</div>

<div class="setting-row">
  <label for="break-friction-incremental">
    <input type="checkbox" id="break-friction-incremental" value="breakSkipFrictionIncrementalEnabled">
    <span data-i18n="preferences.skipFriction.incrementalEnabled">Enable incremental friction</span>
  </label>
</div>

<div class="setting-row">
  <label for="break-friction-max-words" data-i18n="preferences.skipFriction.maxWords">Maximum words</label>
  <input type="number" id="break-friction-max-words" min="1" max="50" value="5">
</div>

<div class="setting-row">
  <label data-i18n="preferences.skipFriction.totalCount">Total skips</label>
  <span id="break-friction-total-count" class="stat-display">0</span>
  <button id="reset-break-count" data-i18n="preferences.skipFriction.resetCount">Reset</button>
</div>
```

---

#### Step 6.2: Add Preferences JavaScript

**File**: `app/preferences-renderer.js`

**Action**: Add load/save logic for friction settings.

**Find the existing settings load function** (might be `loadSettings()` or similar):

```javascript
async function loadSettings () {
  // ... existing settings loading ...
  
  // Load mini break friction settings
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
  
  // Load long break friction settings
  document.getElementById('break-friction-enabled').checked = 
    await window.settings.get('breakSkipFrictionEnabled')
  document.getElementById('break-friction-char-length').value = 
    await window.settings.get('breakSkipFrictionCharLength')
  document.getElementById('break-friction-incremental').checked = 
    await window.settings.get('breakSkipFrictionIncrementalEnabled')
  document.getElementById('break-friction-max-words').value = 
    await window.settings.get('breakSkipFrictionMaxWords')
  document.getElementById('break-friction-total-count').textContent = 
    await window.settings.get('breakSkipFrictionTotalCount')
}
```

**Find the existing settings save function**:

```javascript
async function saveSettings () {
  // ... existing settings saving ...
  
  // Save mini break friction settings
  await window.settings.set('microbreakSkipFrictionEnabled', 
    document.getElementById('microbreak-friction-enabled').checked)
  await window.settings.set('microbreakSkipFrictionCharLength', 
    parseInt(document.getElementById('microbreak-friction-char-length').value))
  await window.settings.set('microbreakSkipFrictionIncrementalEnabled', 
    document.getElementById('microbreak-friction-incremental').checked)
  await window.settings.set('microbreakSkipFrictionMaxWords', 
    parseInt(document.getElementById('microbreak-friction-max-words').value))
  
  // Save long break friction settings
  await window.settings.set('breakSkipFrictionEnabled', 
    document.getElementById('break-friction-enabled').checked)
  await window.settings.set('breakSkipFrictionCharLength', 
    parseInt(document.getElementById('break-friction-char-length').value))
  await window.settings.set('breakSkipFrictionIncrementalEnabled', 
    document.getElementById('break-friction-incremental').checked)
  await window.settings.set('breakSkipFrictionMaxWords', 
    parseInt(document.getElementById('break-friction-max-words').value))
}
```

**Add reset button handlers**:

```javascript
document.getElementById('reset-microbreak-count').addEventListener('click', async () => {
  await window.settings.set('microbreakSkipFrictionTotalCount', 0)
  document.getElementById('microbreak-friction-total-count').textContent = '0'
})

document.getElementById('reset-break-count').addEventListener('click', async () => {
  await window.settings.set('breakSkipFrictionTotalCount', 0)
  document.getElementById('break-friction-total-count').textContent = '0'
})
```

**Verification**:
```bash
npm start
# Open preferences
# Verify all friction settings appear
# Change values and save
# Reopen preferences → Values should persist
# Click reset button → Counter should reset to 0
```

---

### Phase 7: Testing and Polish (Estimated: 2-3 hours)

**Goal**: Ensure all requirements met and no regressions.

#### Step 7.1: Run Linter

```bash
npm run lint
# Fix any StandardJS violations (no semicolons, 2-space indent, etc.)
```

---

#### Step 7.2: Run Unit Tests

```bash
npm test
# Ensure all existing tests pass
# Ensure new frictionGenerator tests pass
# Ensure new canSkip tests pass
```

---

#### Step 7.3: Manual E2E Testing

**Test Checklist**:

- [ ] Mini break friction interface appears when skip clicked in strict mode
- [ ] Long break friction interface appears when skip clicked in strict mode
- [ ] Character-by-character visual feedback works (green/red/empty)
- [ ] Skip button appears only when all characters correct
- [ ] Clicking skip button increments total and sequential counters
- [ ] Completing break without skip resets sequential counter to 0
- [ ] Incremental friction increases word count correctly (1 + sequential count)
- [ ] Word count caps at configured maximum
- [ ] Counters persist across app restarts
- [ ] Settings persist across app restarts
- [ ] Reset counter button works in preferences
- [ ] No regressions in non-strict mode skip behavior
- [ ] No regressions in strict mode without friction enabled
- [ ] Theme colors work in light and dark mode
- [ ] Interface responsive on different window sizes

---

#### Step 7.4: Performance Testing

**Test Scenarios**:

1. Generate friction UI with 100 characters (max)
   - **Target**: Render in <1 second
   
2. Type characters rapidly
   - **Target**: Visual feedback in <100ms per keystroke
   
3. Incremental friction with 5 words × 20 chars
   - **Target**: UI responsive, no lag

**Tool**: Use browser DevTools Performance tab in break window.

---

### Phase 8: Documentation and Cleanup (Estimated: 1 hour)

#### Step 8.1: Update CHANGELOG

**File**: `CHANGELOG.md`

**Action**: Add entry under "Unreleased" section.

```markdown
## [Unreleased]

### Added
- Skip friction for strict mode: Requires typing a randomly-generated complex string to skip breaks, introducing deliberate friction to discourage casual skipping
- Incremental friction: Increases the number of words required based on sequential skips (separate tracking for mini and long breaks)
- Skip counters: Track total and sequential skips with reset functionality in preferences
- Character-by-character visual feedback (green for correct, red for incorrect)
- Configurable character length (1-50) and maximum words (1-20) per break type
```

---

#### Step 8.2: Update README (if applicable)

Add mention of skip friction feature in relevant sections (e.g., "Features" or "Strict Mode").

---

#### Step 8.3: Clean Up Debug Code

- Remove any `console.log()` statements added during development
- Remove any commented-out code
- Ensure all code follows StandardJS style

---

## Verification Matrix

### Functional Requirements Coverage

| FR-ID | Requirement | Verification Method |
|-------|-------------|---------------------|
| FR-001 | Friction enabled option | Manual test: Check preferences |
| FR-002 | Configure char length | Manual test: Change value in preferences |
| FR-011 | Generate new string per skip | Manual test: Skip twice, verify different strings |
| FR-020 | Column-based display | Manual test: Inspect friction UI |
| FR-030 | Allow corrections | Manual test: Type wrong char, then correct |
| FR-034 | Hide skip button initially | Manual test: Verify button hidden |
| FR-039 | Maintain total counter | Unit test + manual test |
| FR-040 | Maintain sequential counter | Unit test + manual test |
| FR-043 | Reset sequential on completion | Manual test: Complete break, check counter |

*(Continue for all 51 FRs - see spec.md)*

---

### Success Criteria Validation

| SC-ID | Criteria | Target | Actual | Pass? |
|-------|----------|--------|--------|-------|
| SC-001 | Configure settings time | <30s | ___ | ___ |
| SC-002 | Friction UI load time | <1s | ___ | ___ |
| SC-003 | Visual feedback latency | <100ms | ___ | ___ |
| SC-010 | Responsive at 100 chars | No lag | ___ | ___ |

*(Measure during testing and fill in "Actual" column)*

---

## Troubleshooting

### Issue: Friction UI not appearing

**Diagnosis**:
1. Check strict mode enabled: `await window.settings.get('breakStrictMode')`
2. Check friction enabled: `await window.settings.get('breakSkipFrictionEnabled')`
3. Check console for errors

**Solution**: Verify both settings are `true`.

---

### Issue: Visual feedback not updating

**Diagnosis**:
1. Check CSS classes applied: Inspect `.friction-column` elements
2. Check theme colors defined: Inspect `:root` variables in DevTools

**Solution**: Ensure `color-scheme.css` includes friction colors.

---

### Issue: Counters not persisting

**Diagnosis**:
1. Check electron-store writes: Add `console.log()` before `settings.set()`
2. Check default settings: Verify counters exist in `defaultSettings.js`

**Solution**: Ensure `defaultSettings.js` includes all 12 friction settings.

---

### Issue: Tests failing

**Diagnosis**:
1. Run `npm test -- --reporter=verbose` for detailed output
2. Check for ES Module import errors (missing `.js` extensions)

**Solution**: Ensure all imports include `.js` extension (ESM requirement).

---

## Rollout Plan

### Beta Testing (Optional)

1. Enable feature for internal testing
2. Gather feedback on friction difficulty (char length, incremental scaling)
3. Adjust defaults if needed (e.g., maxWords from 5 to 3)

### Release

1. Merge feature branch to main
2. Tag release with version bump
3. Update release notes with friction feature details
4. Monitor user feedback for first 2 weeks

---

## Summary

**Total Implementation Time**: 8-12 hours

**Phase Breakdown**:
- Phase 1 (Settings): 1-2 hours
- Phase 2 (String Generation): 1 hour
- Phase 3 (canSkip): 30 minutes
- Phase 4 (Friction UI): 3-4 hours
- Phase 5 (Counter Reset): 30 minutes
- Phase 6 (Preferences UI): 2-3 hours
- Phase 7 (Testing): 2-3 hours
- Phase 8 (Documentation): 1 hour

**Files Modified**: ~10 (defaultSettings.js, utils.js, break-renderer.js, microbreak-renderer.js, preferences-renderer.js, break.html, microbreak.html, preferences.html, break.css, color-scheme.css, en.json)

**Files Created**: 2 (frictionGenerator.js, test/frictionGenerator.js)

**New Dependencies**: 0

**Lines of Code**: ~800 (400 production + 400 tests/docs)

---

## Next Steps

After implementation complete:
1. Run `/speckit.tasks` command to generate detailed task breakdown
2. Create pull request with all changes
3. Request code review focusing on:
   - StandardJS compliance
   - No regressions in existing functionality
   - Accessibility (keyboard navigation, ARIA labels)
   - Performance (render time, feedback latency)

---

## References

- Feature Specification: `specs/002-strict-mode-password/spec.md`
- Implementation Plan: `specs/002-strict-mode-password/plan.md`
- Research Decisions: `specs/002-strict-mode-password/research.md`
- Data Model: `specs/002-strict-mode-password/data-model.md`
- Contracts: `specs/002-strict-mode-password/contracts/`
