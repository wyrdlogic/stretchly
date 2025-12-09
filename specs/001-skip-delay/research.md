# Research: Configurable Skip Delay

**Date**: 2025-12-09  
**Feature**: 001-skip-delay  
**Purpose**: Resolve technical unknowns and establish implementation patterns

## Executive Summary

All technical context resolved through codebase analysis. Feature will leverage existing patterns for:

- Settings persistence (electron-store)
- Preferences UI (checkbox + range input pattern)
- Break window rendering (existing timer mechanisms)
- Skip button control (existing canSkip() function)

No new dependencies required. Implementation follows StandardJS, ES Modules, and existing Stretchly conventions.

## Technical Context Resolution

### Language/Version

**Decision**: JavaScript with Node.js 22.20.0, Electron 39.0.0  
**Rationale**: Per package.json engines field and existing codebase  
**Source**: `package.json` lines 5-10, constitution requirement

### Primary Dependencies

**Decision**: Use existing dependencies only:

- electron-store (settings persistence)
- i18next (internationalization)
- Electron IPC (main/renderer communication)

**Rationale**: Feature does not require any new functionality beyond what's already available  
**Alternatives Considered**: None needed - existing stack is sufficient  
**Source**: `app/main.js` imports, constitution principle "prefer native modules"

### Storage

**Decision**: electron-store with two new settings:

- `skipDelayEnabled` (boolean, default: false)
- `skipDelayDuration` (number, default: 30000 milliseconds)

**Rationale**: Matches existing pattern for all break-related settings (microbreakPostpone, breakStrictMode, etc.)  
**Source**: `app/utils/defaultSettings.js`, existing settings like `microbreakStrictMode`

### Testing

**Decision**: Vitest with new tests in `test/` directory  
**Rationale**: Existing test infrastructure for utils functions  
**Tests Required**:

- `test/skipDelay.js` - canSkip() logic with delay
- Integration with strict mode
- Countdown calculation edge cases

**Source**: Constitution Principle V, existing `test/utils.js` patterns

### Target Platform

**Decision**: Cross-platform (Windows, macOS, Linux) with no platform-specific code  
**Rationale**: Skip delay is UI-only feature using existing timer mechanisms  
**Source**: Constitution Principle II

### Performance Goals

**Decision**:

- Skip button state update: <200ms after delay expiration
- Countdown UI update: 1-second intervals (acceptable for visual countdown)
- Settings save: <100ms (existing electron-store performance)

**Rationale**: Constitution Principle VII requires <200ms for break window rendering; skip button enable is comparable interaction  
**Source**: `.specify/memory/constitution.md` Principle VII

### Constraints

**Decision**:

- StandardJS code style (NON-NEGOTIABLE)
- ES Modules with explicit .js extensions
- No semicolons, 2-space indent, single quotes
- Self-documenting code (minimal comments)

**Rationale**: Constitution Principle III and IV  
**Source**: `.specify/memory/constitution.md`

### Scale/Scope

**Decision**: Small feature affecting 4 files:

- 1 settings file (defaultSettings.js)
- 2 HTML files (preferences.html, break.html, microbreak.html)
- 2 renderer files (preferences-renderer.js, break-renderer.js, microbreak-renderer.js)
- 1 utils file (utils.js)
- 1 locale file (en.json + all other locales via Weblate)

**Rationale**: Minimal scope, leverages existing infrastructure  
**Source**: Codebase analysis

## Implementation Patterns

### Pattern 1: Settings Management

**Current Pattern** (from `app/utils/defaultSettings.js`):

```javascript
export default {
  microbreakStrictMode: false,
  breakStrictMode: false,
  microbreakPostpone: true,
  breakPostpone: true,
  // ... other settings
}
```

**Apply to Skip Delay**:

```javascript
export default {
  skipDelayEnabled: false,        // Toggle control
  skipDelayDuration: 30000,       // 30 seconds default in ms
  // ... existing settings
}
```

**Source**: Lines 1-85 of `app/utils/defaultSettings.js`

### Pattern 2: Preferences UI - Toggle Checkbox

**Current Pattern** (from `app/preferences.html` line 206):

```html
<div>
  <input type="checkbox" value="microbreakPostpone" id="enablePostponeMini">
  <label data-i18next="preferences.schedule.enablePostponeMini" for="enablePostponeMini"></label>
</div>
```

**Apply to Skip Delay**:

```html
<div>
  <input type="checkbox" value="skipDelayEnabled" id="enableSkipDelay">
  <label data-i18next="preferences.schedule.enableSkipDelay" for="enableSkipDelay"></label>
</div>
```

**Source**: `app/preferences.html` lines 206-209

### Pattern 3: Preferences UI - Range Input with Output

**Current Pattern** (from `app/preferences.html` lines 225-237):

```html
<div>
  <label data-i18next="preferences.schedule.breakFor" for="longBreakFor"></label>
  <input type="range" min="1" max="60" step="1" name="breakDuration" 
    data-divisor="60000" id="longBreakFor">
  <output data-unit="minutes"></output>
</div>
```

**Apply to Skip Delay**:

```html
<div>
  <label data-i18next="preferences.schedule.skipDelayDuration" for="skipDelayDuration"></label>
  <input type="range" min="1" max="300" step="1" name="skipDelayDuration" 
    data-divisor="1000" id="skipDelayDuration">
  <output data-unit="seconds"></output>
</div>
```

**Notes**:

- Use data-divisor="1000" to convert seconds to milliseconds
- Range 1-300 seconds per spec requirement
- Will need JavaScript to disable/enable based on checkbox state

**Source**: `app/preferences.html` schedule section

### Pattern 4: Conditional Input Enable/Disable

**Current Pattern** (from `app/preferences-renderer.js` lines 257-263):

```javascript
document.querySelectorAll('.enabletype').forEach((element) => {
  element.onclick = async (event) => {
    const enabletypeChecked = document.querySelectorAll('.enabletype:checked')
    if (enabletypeChecked.length === 0) {
      element.checked = true
      // ... prevent disabling
    }
  }
})
```

**Apply to Skip Delay** (NEW pattern needed):

```javascript
const skipDelayCheckbox = document.querySelector('#enableSkipDelay')
const skipDelayInput = document.querySelector('#skipDelayDuration')

skipDelayCheckbox.onchange = (event) => {
  skipDelayInput.disabled = !skipDelayCheckbox.checked
  window.settings.saveSettings('skipDelayEnabled', skipDelayCheckbox.checked)
}

// Initialize state
skipDelayInput.disabled = !skipDelayCheckbox.checked
```

**Source**: Requirement FR-008, similar to break enable logic

### Pattern 5: Skip Button Visibility Control

**Current Pattern** (from `app/break-renderer.js` lines 73-83):

```javascript
if (window.utils.canSkip(strictMode, postpone, passedPercent, postponePercent)) {
  closeElement.classList.remove('hidden')
} else {
  closeElement.classList.add('hidden')
}
```

**Current canSkip()** (from `app/utils/utils.js` lines 56-58):

```javascript
function canSkip (strictMode, postpone, passedPercent, postponePercent) {
  return !((postpone && passedPercent <= postponePercent) || strictMode)
}
```

**Apply to Skip Delay** (MODIFY canSkip):

```javascript
function canSkip (strictMode, postpone, passedPercent, postponePercent, skipDelayEnabled, skipDelayPassed) {
  if (strictMode) return false
  if (postpone && passedPercent <= postponePercent) return false
  if (skipDelayEnabled && !skipDelayPassed) return false
  return true
}
```

**Source**: `app/utils/utils.js` lines 56-58, `app/break-renderer.js` lines 73-83

### Pattern 6: Countdown Display

**Current Pattern** (from `app/break-renderer.js` lines 84-85):

```javascript
progress.value = (100 - passedPercent) * progress.max / 100
progressTime.innerHTML = await window.utils.formatTimeRemaining(duration - passed, locale)
```

**Apply to Skip Delay** (NEW element needed):

```html
<!-- In break.html and microbreak.html -->
<span id='skip-countdown' aria-hidden="true"></span>
```

```javascript
// In break-renderer.js and microbreak-renderer.js
if (skipDelayEnabled && passed < skipDelayDuration) {
  const skipRemaining = skipDelayDuration - passed
  skipCountdown.innerHTML = await window.utils.formatTimeRemaining(skipRemaining, locale)
  skipCountdown.classList.remove('hidden')
} else {
  skipCountdown.classList.add('hidden')
}
```

**Source**: Requirement FR-011 (MANDATORY countdown), existing progress display pattern

### Pattern 7: Internationalization

**Current Pattern** (from `app/locales/en.json`):

```json
{
  "preferences": {
    "schedule": {
      "enablePostponeMini": "Enable postponement for Mini break",
      "strictModeInfo": "Strict mode prevents you from skipping..."
    }
  }
}
```

**Apply to Skip Delay**:

```json
{
  "preferences": {
    "schedule": {
      "skipDelay": "Skip delay:",
      "skipDelayInfo": "Skip delay requires you to view the break for a minimum time before the skip button becomes available, encouraging healthier break habits.",
      "enableSkipDelay": "Enforce delay before skipping breaks",
      "skipDelayDuration": "Skip delay duration:"
    }
  },
  "break": {
    "skipAvailableIn": "Skip available in {{seconds}} seconds"
  }
}
```

**Source**: `app/locales/en.json`, Weblate manages translations

## Best Practices for Electron + Stretchly

### 1. Settings Persistence

- Use milliseconds for all time-based settings (consistent with microbreakDuration, breakDuration)
- Provide data-divisor attribute in HTML to convert display units (seconds) to storage units (milliseconds)
- Boolean toggles use checkbox value attribute matching setting key name

**Source**: All existing duration settings in defaultSettings.js

### 2. Renderer Process Communication

- Use window.settings.saveSettings() for immediate persistence
- Use window.settings.get() for async retrieval
- Settings changes auto-trigger main process updates via IPC

**Source**: `app/preferences-renderer.js` line 185, `app/utils/context-bridge-exposers.js`

### 3. Break Window Timer Management

- Use setInterval with 100ms frequency for smooth UI updates
- Calculate based on Date.now() - started for wall-clock accuracy (survives sleep/resume)
- Update visual elements based on calculated state, not timer ticks

**Source**: `app/break-renderer.js` lines 65-86, constitution principle on performance

### 4. UI Accessibility

- Add aria-hidden="true" to countdown timers (prevents screen reader spam)
- Use semantic HTML (<label for="...">)
- Maintain keyboard navigability (existing focus management works)

**Source**: Constitution Principle VI, existing break window structure

### 5. Cross-Platform Compatibility

- No platform-specific code needed for this feature
- Electron timer APIs work identically across platforms
- CSS/HTML patterns already cross-platform

**Source**: Constitution Principle II

## Risk Mitigations (Technical)

### Risk: System Sleep/Resume Countdown Accuracy

**Mitigation Applied**: Existing pattern already uses Date.now() - started for wall-clock time calculation  
**Source**: `app/break-renderer.js` line 69 `const passed = now - started`

### Risk: Strict Mode Interaction

**Mitigation Applied**: Strict mode check comes first in canSkip() logic (short-circuit evaluation)  
**Source**: Existing canSkip() implementation, spec requirement FR-016

### Risk: Performance Impact

**Mitigation Applied**:

- Reuse existing 100ms setInterval (no new timer)
- Simple arithmetic for countdown calculation
- Minimal DOM manipulation (single span update)

**Source**: Constitution Principle VII (<200ms requirement)

### Risk: Internationalization Complexity

**Mitigation Applied**:

- Reuse existing formatTimeRemaining() utility
- Countdown numbers don't require translation
- Weblate handles label translations

**Source**: Existing i18next integration, `app/utils/utils.js` formatTimeRemaining

## Open Questions

None - all technical context resolved.

## References

- Constitution: `.specify/memory/constitution.md`
- Feature Spec: `specs/001-skip-delay/spec.md`
- Default Settings: `app/utils/defaultSettings.js`
- Preferences UI: `app/preferences.html`, `app/preferences-renderer.js`
- Break Window: `app/break.html`, `app/break-renderer.js`, `app/microbreak-renderer.js`
- Utils: `app/utils/utils.js`
- Locales: `app/locales/en.json`
