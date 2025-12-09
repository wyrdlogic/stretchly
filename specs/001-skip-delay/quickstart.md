# Quick Start Guide: Skip Delay Development

**Feature**: 001-skip-delay  
**Target Audience**: Developers implementing the skip delay feature  
**Prerequisites**: Stretchly development environment set up (Node.js 22.20.0, npm dependencies installed)

## Overview

This guide walks you through implementing the configurable skip delay feature in ~1-2 hours. Feature adds an optional delay before skip button becomes available during breaks, with visual countdown.

## Before You Start

### 1. Verify Environment

```powershell
# Confirm you're on feature branch
git branch --show-current
# Should output: 001-skip-delay

# Confirm Node.js version
node --version
# Should output: v22.20.0 or v22.21.1

# Run linter to confirm setup
npm run lint
# Should output: no errors (existing code passes)

# Run existing tests
npm test
# Should output: all tests passing
```

### 2. Read Key Documents

- [ ] Feature Spec: `specs/001-skip-delay/spec.md` (requirements)
- [ ] Research: `specs/001-skip-delay/research.md` (implementation patterns)
- [ ] Data Model: `specs/001-skip-delay/data-model.md` (entities and state)
- [ ] This file (you're here!)

**Time**: ~15 minutes reading

---

## Implementation Steps

### Step 1: Add Default Settings (5 minutes)

**File**: `app/utils/defaultSettings.js`

**Action**: Add two new properties to the exported object

```javascript
// At appropriate location (alphabetically sorted or grouped with break settings)
export default {
  // ... existing settings ...
  skipDelayEnabled: false,        // NEW: Default disabled
  skipDelayDuration: 30000,       // NEW: 30 seconds in milliseconds
  // ... existing settings ...
}
```

**Verify**:
```powershell
npm run lint
# Should pass (no semicolons, correct format)
```

**Reference**: `research.md` Pattern 1

---

### Step 2: Update canSkip() Function (10 minutes)

**File**: `app/utils/utils.js`

**Action**: Modify canSkip() signature and logic

**Before**:
```javascript
function canSkip (strictMode, postpone, passedPercent, postponePercent) {
  return !((postpone && passedPercent <= postponePercent) || strictMode)
}
```

**After**:
```javascript
function canSkip (strictMode, postpone, passedPercent, postponePercent, skipDelayEnabled, skipDelayPassed) {
  if (strictMode) return false
  if (postpone && passedPercent <= postponePercent) return false
  if (skipDelayEnabled && !skipDelayPassed) return false
  return true
}
```

**Verify**:
```powershell
npm run lint
# Should pass

# Run utils tests (will fail - expected, fix in Step 7)
npm test test/utils.js
```

**Reference**: `research.md` Pattern 5

---

### Step 3: Add Preferences UI - HTML (15 minutes)

**File**: `app/preferences.html`

**Action**: Add skip delay section to Schedule tab (after strict mode section, before closing `</div>` of schedule class)

```html
    <!-- After strict mode section, before </div class="schedule"> -->
    <div>
      <hr />
    </div>
    <div>
      <span data-i18next="preferences.schedule.skipDelay">
      </span>
    </div>
    <div>
      <p data-i18next="preferences.schedule.skipDelayInfo">
      </p>
    </div>
    <div>
      <input type="checkbox" value="skipDelayEnabled" id="enableSkipDelay">
      <label data-i18next="preferences.schedule.enableSkipDelay" for="enableSkipDelay"></label>
    </div>
    <div>
      <label data-i18next="preferences.schedule.skipDelayDuration" for="skipDelayDuration"></label>
      <input type="range" min="1" max="300" step="1" name="skipDelayDuration" 
        data-divisor="1000" id="skipDelayDuration">
      <output data-unit="seconds"></output>
    </div>
```

**Verify**: Open Stretchly preferences (if running app) - new section should appear but functionality not yet wired.

**Reference**: `research.md` Pattern 2 and 3

---

### Step 4: Add Preferences UI - JavaScript (20 minutes)

**File**: `app/preferences-renderer.js`

**Action**: Add logic to enable/disable duration input based on checkbox state

**Location**: After existing checkbox onchange setup (around line 180-188), add:

```javascript
// Skip delay: enable/disable duration input based on checkbox
const skipDelayCheckbox = document.querySelector('#enableSkipDelay')
const skipDelayInput = document.querySelector('#skipDelayDuration')

if (skipDelayCheckbox && skipDelayInput) {
  // Initialize input state based on current checkbox
  skipDelayInput.disabled = !skipDelayCheckbox.checked
  
  // Update input state when checkbox changes
  skipDelayCheckbox.onchange = (event) => {
    skipDelayInput.disabled = !skipDelayCheckbox.checked
    window.settings.saveSettings('skipDelayEnabled', skipDelayCheckbox.checked)
  }
}
```

**Note**: Standard checkbox onchange handler (lines 180-188) already handles saving skipDelayEnabled when checkbox changes. The code above adds the input enable/disable behavior.

**Verify**:
```powershell
npm run lint
# Should pass

# Test manually:
npm start
# Open Preferences > Schedule
# Toggle "Enforce delay before skipping breaks" checkbox
# Duration input should enable/disable accordingly
```

**Reference**: `research.md` Pattern 4

---

### Step 5: Add Break Window UI - HTML (10 minutes)

**Files**: `app/break.html` AND `app/microbreak.html`

**Action**: Add countdown display element (identical change in both files)

**Location**: After progress time element, before closing div:

```html
        <progress id='progress' max="10000" aria-hidden="true"></progress>
        <span id='progress-time' aria-hidden="true"></span>
        <!-- NEW: Skip delay countdown -->
        <span id='skip-countdown' class='hidden' aria-hidden="true"></span>
      </div>
```

**Verify**: Visual inspection - countdown span should not be visible initially (hidden class)

**Reference**: `research.md` Pattern 6

---

### Step 6: Add Break Window Logic (30 minutes)

**Files**: `app/break-renderer.js` AND `app/microbreak-renderer.js`

**Action**: Integrate skip delay countdown and button control (identical changes in both files)

**Step 6a**: Read skip delay settings at initialization (after locale, around line 61):

```javascript
  const locale = await window.settings.get('language')
  const skipDelayEnabled = await window.settings.get('skipDelayEnabled')
  const skipDelayDuration = await window.settings.get('skipDelayDuration')
```

**Step 6b**: Get countdown element reference (with other element refs, around line 46):

```javascript
  const postponeElement = document.querySelector('#postpone')
  const closeElement = document.querySelector('#close')
  const manualFinishElement = document.querySelector('#finish')
  const skipCountdownElement = document.querySelector('#skip-countdown') // NEW
```

**Step 6c**: Update setInterval logic (replace canSkip call and add countdown, around line 73-83):

```javascript
  setInterval(async () => {
    if (await window.settings.get('currentTimeInBreaks')) {
      document.querySelector('.breaks > :last-child').innerHTML = (new Date()).toLocaleTimeString()
    }
    const now = Date.now()
    const passed = now - started
    if (!manualAwaiting) {
      if (passed < duration) {
        const passedPercent = passed / duration * 100
        
        // Postpone button logic (existing)
        if (window.utils.canPostpone(postpone, passedPercent, postponePercent)) {
          postponeElement.classList.remove('hidden')
        } else {
          postponeElement.classList.add('hidden')
        }
        
        // Skip delay logic (NEW)
        const skipDelayPassed = passed >= skipDelayDuration
        
        // Skip button logic (MODIFIED - added two new parameters)
        if (window.utils.canSkip(strictMode, postpone, passedPercent, postponePercent, 
                                 skipDelayEnabled, skipDelayPassed)) {
          closeElement.classList.remove('hidden')
        } else {
          closeElement.classList.add('hidden')
        }
        
        // Skip countdown display (NEW)
        if (skipDelayEnabled && !skipDelayPassed) {
          const remaining = skipDelayDuration - passed
          skipCountdownElement.innerHTML = await window.utils.formatTimeRemaining(remaining, locale)
          skipCountdownElement.classList.remove('hidden')
        } else {
          skipCountdownElement.classList.add('hidden')
        }
        
        // Progress bar and time (existing)
        progress.value = (100 - passedPercent) * progress.max / 100
        progressTime.innerHTML = await window.utils.formatTimeRemaining(duration - passed, locale)
      }
    } else {
      progressTime.innerHTML = await window.utils.formatElapsedDuration(passed, locale)
    }
  }, 100)
```

**Verify**:
```powershell
npm run lint
# Should pass

# Test manually:
npm start
# 1. Enable skip delay in Preferences, set to 10 seconds
# 2. Trigger a break (Ctrl+X or wait for scheduled break)
# 3. Observe countdown display for 10 seconds
# 4. Observe skip button appears after countdown
```

**Reference**: `research.md` Pattern 6, `data-model.md` State Transitions

---

### Step 7: Add Internationalization Strings (10 minutes)

**File**: `app/locales/en.json`

**Action**: Add skip delay strings to preferences.schedule section

**Location**: In preferences.schedule object (after strictMode strings):

```json
      "enableStrictLong": "Enable Strict mode for Long breaks",
      "cantDisableBoth": "It is not possible to disable both types of breaks",
      "skipDelay": "Skip delay:",
      "skipDelayInfo": "Skip delay requires you to view the break for a minimum time before the skip button becomes available, encouraging healthier break habits.",
      "enableSkipDelay": "Enforce delay before skipping breaks",
      "skipDelayDuration": "Skip delay duration:"
```

**Note**: Weblate will handle translations for other languages. Only modify en.json.

**Verify**:
```powershell
npm run lint
# Should pass

# Test manually:
npm start
# Open Preferences > Schedule
# Verify new strings appear in English
```

**Reference**: `research.md` Pattern 7

---

### Step 8: Write Tests (30 minutes)

**File**: `test/skipDelay.js` (CREATE NEW)

**Action**: Create comprehensive tests for skip delay logic

```javascript
import { describe, it, expect } from 'vitest'
import utils from '../app/utils/utils.js'

describe('canSkip with skip delay', () => {
  it('allows skip when feature disabled', () => {
    expect(utils.canSkip(false, false, 50, 30, false, false)).toBe(true)
  })

  it('prevents skip when delay enabled and not passed', () => {
    expect(utils.canSkip(false, false, 50, 30, true, false)).toBe(false)
  })

  it('allows skip when delay enabled and passed', () => {
    expect(utils.canSkip(false, false, 50, 30, true, true)).toBe(true)
  })

  it('strict mode overrides skip delay', () => {
    expect(utils.canSkip(true, false, 50, 30, true, true)).toBe(false)
  })

  it('postpone window overrides skip delay when delay passed', () => {
    expect(utils.canSkip(false, true, 20, 30, true, true)).toBe(false)
  })

  it('postpone window and skip delay both prevent skip', () => {
    expect(utils.canSkip(false, true, 20, 30, true, false)).toBe(false)
  })

  it('allows skip after both postpone window and skip delay pass', () => {
    expect(utils.canSkip(false, true, 50, 30, true, true)).toBe(true)
  })
})
```

**Verify**:
```powershell
npm test test/skipDelay.js
# Should output: 7 passing
```

**Reference**: Constitution Principle V, `data-model.md` State Transition Table

---

### Step 9: Update Existing Tests (15 minutes)

**File**: `test/utils.js`

**Action**: Update existing canSkip() test calls to include new parameters

**Find all** calls to `canSkip()` and add two false parameters:

**Before**:
```javascript
utils.canSkip(false, false, 0, 20)
```

**After**:
```javascript
utils.canSkip(false, false, 0, 20, false, false)
```

**Systematic approach**:
1. Search file for "canSkip("
2. For each call, add `, false, false` before closing paren
3. These represent skipDelayEnabled=false, skipDelayPassed=false (feature disabled)

**Verify**:
```powershell
npm test test/utils.js
# Should output: all passing (previously failing tests now pass)

npm test
# Should output: all tests passing
```

---

### Step 10: Final Verification (10 minutes)

**Comprehensive checks**:

```powershell
# Lint check
npm run lint
# Expected: no errors

# All tests pass
npm test
# Expected: all passing

# Manual testing checklist:
npm start
```

**Manual Test Checklist**:
- [ ] Preferences > Schedule shows skip delay section
- [ ] Toggle checkbox enables/disables duration input
- [ ] Duration slider shows seconds (1-300 range)
- [ ] Settings persist after app restart
- [ ] With feature disabled: skip immediately available (backward compatibility)
- [ ] With feature enabled (30 sec): countdown displays for 30 seconds
- [ ] With feature enabled (10 sec): countdown displays for 10 seconds
- [ ] Skip button appears after countdown expires
- [ ] Strict mode overrides skip delay (skip never appears)
- [ ] Works on both microbreaks and long breaks
- [ ] System sleep/resume doesn't break countdown (countdown jumps forward correctly)

**Reference**: `spec.md` Success Validation, `data-model.md` Testing Scenarios

---

## Troubleshooting

### Issue: Linter errors about semicolons
**Solution**: Remove all semicolons. StandardJS doesn't use them.

### Issue: Tests fail with "canSkip is not a function"
**Solution**: Verify import path in test file: `import utils from '../app/utils/utils.js'` (include .js extension)

### Issue: Countdown not displaying
**Solution**: Check browser console for errors. Verify `skipCountdownElement` is not null. Confirm element exists in HTML.

### Issue: Duration input not disabling
**Solution**: Verify checkbox value="skipDelayEnabled" matches setting name. Check browser console for JS errors.

### Issue: Settings not persisting
**Solution**: Check electron-store location (Preferences > About > Settings file). Verify electron-store is working for other settings.

---

## Architecture Decisions

### Why store duration in milliseconds but display in seconds?
**Reason**: Consistency with existing Stretchly settings (microbreakDuration, breakDuration all use milliseconds). HTML data-divisor="1000" handles conversion.

### Why disable duration input when feature disabled?
**Reason**: Spec requirement FR-008. Also provides clear UX feedback that setting is inactive.

### Why not pass skipDelay settings via sendBreakData()?
**Reason**: Settings are user preferences, not break scheduling data. Keeps IPC contracts minimal.

### Why is countdown MANDATORY?
**Reason**: Spec requirement FR-011. Without visual feedback, users wouldn't understand why skip is disabled.

### Why does strict mode override skip delay?
**Reason**: Spec requirement FR-016. Strict mode is "stronger" prohibition (prevents skip entirely vs delaying it).

---

## Next Steps

After implementation complete:

1. **Code Review**: Create PR from 001-skip-delay branch
2. **User Testing**: Get feedback on default duration (30 seconds)
3. **Documentation**: Update README.md with feature description
4. **Translation**: Weblate will notify translators of new strings
5. **Release Notes**: Add to CHANGELOG.md for next version

---

## Time Estimate Summary

| Step | Task | Time |
|------|------|------|
| 1 | Default settings | 5 min |
| 2 | Update canSkip() | 10 min |
| 3 | Preferences HTML | 15 min |
| 4 | Preferences JS | 20 min |
| 5 | Break window HTML | 10 min |
| 6 | Break window JS | 30 min |
| 7 | i18n strings | 10 min |
| 8 | New tests | 30 min |
| 9 | Update tests | 15 min |
| 10 | Verification | 10 min |
| **Total** | | **~2.5 hours** |

---

## References

- Feature Spec: `specs/001-skip-delay/spec.md`
- Implementation Plan: `specs/001-skip-delay/plan.md`
- Research: `specs/001-skip-delay/research.md`
- Data Model: `specs/001-skip-delay/data-model.md`
- Contracts: `specs/001-skip-delay/contracts/`
- Constitution: `.specify/memory/constitution.md`
