# IPC Contracts: Skip Delay

**Feature**: 001-skip-delay  
**Purpose**: Document Electron IPC communication patterns for skip delay feature

## Overview

Skip delay feature uses **existing** IPC communication patterns. No new IPC channels required.

## Settings IPC (Existing Pattern)

### Read Setting: `window.settings.get(key)`

**Description**: Async retrieval of setting value from electron-store in main process

**Usage in Skip Delay**:

```javascript
// In preferences-renderer.js initialization
const skipDelayEnabled = await window.settings.get('skipDelayEnabled')
const skipDelayDuration = await window.settings.get('skipDelayDuration')

// In break-renderer.js initialization  
const skipDelayEnabled = await window.settings.get('skipDelayEnabled')
const skipDelayDuration = await window.settings.get('skipDelayDuration')
```

**Channel**: Exposed via `app/utils/context-bridge-exposers.js` (already exists)

**Return Type**:

- For `skipDelayEnabled`: Boolean (false if not set)
- For `skipDelayDuration`: Number (30000 if not set, per defaultSettings)

---

### Write Setting: `window.settings.saveSettings(key, value)`

**Description**: Sync write of setting value to electron-store in main process

**Usage in Skip Delay**:

```javascript
// In preferences-renderer.js when checkbox changes
window.settings.saveSettings('skipDelayEnabled', checkbox.checked)

// In preferences-renderer.js when range slider changes
window.settings.saveSettings('skipDelayDuration', rangeValue * 1000) // convert seconds to ms
```

**Channel**: Exposed via `app/utils/context-bridge-exposers.js` (already exists)

**Side Effects**:

- Triggers main process to update electron-store
- May trigger scheduler recalculation (existing behavior)
- Does NOT affect currently active break windows (they read settings at initialization)

---

### Read All Settings: `window.settings.currentSettings()`

**Description**: Async retrieval of entire settings object

**Usage in Skip Delay**:

```javascript
// In preferences-renderer.js initialization
const settings = await window.settings.currentSettings()
const skipDelayCheckbox = document.querySelector('#enableSkipDelay')
skipDelayCheckbox.checked = settings.skipDelayEnabled || false
```

**Channel**: Exposed via `app/utils/context-bridge-exposers.js` (already exists)

**Return Type**: Object with all settings including skipDelayEnabled and skipDelayDuration

---

## Break Window IPC (Existing Pattern)

### Send Break Data: `window.breaks.sendBreakData()`

**Description**: Retrieves break initialization data from main process

**Current Signature** (from `app/break-renderer.js`):

```javascript
const [idea, started, duration, strictMode, postpone, 
  postponePercent, backgroundColor] = await window.breaks.sendBreakData()
```

**Modification Required**: NO CHANGE to IPC contract

**Rationale**: Skip delay settings are read directly via `window.settings.get()` in break-renderer, not passed via sendBreakData(). This maintains separation of concerns (break scheduling vs user preferences).

**Alternative Considered**: Adding skipDelayEnabled and skipDelayDuration to sendBreakData() array, but rejected to avoid expanding IPC surface area unnecessarily.

---

### Finish Break: `window.breaks.finishBreak()`

**Description**: Signals main process to end current break

**Usage in Skip Delay**: NO CHANGE (skip button onclick handler remains same)

**Contract**: No parameters, no return value

---

### Signal Loaded: `window.breaks.signalLoaded()`

**Description**: Notifies main process that break window has finished rendering

**Usage in Skip Delay**: NO CHANGE (existing call at end of onload)

**Contract**: No parameters, no return value

---

## Utils IPC (Existing Pattern)

### Format Time Remaining: `window.utils.formatTimeRemaining(milliseconds, locale)`

**Description**: Formats milliseconds as localized human-readable time string

**Usage in Skip Delay**:

```javascript
// Display countdown
const remaining = skipDelayDuration - elapsedTime
skipCountdown.innerHTML = await window.utils.formatTimeRemaining(remaining, locale)
```

**Channel**: Exposed via `app/utils/context-bridge-exposers.js` (already exists)

**Return Type**: Promise<String> (e.g., "29 seconds", "1 minute 15 seconds")

---

### Can Skip: `window.utils.canSkip(...)`

**Current Signature** (from `app/utils/context-bridge-exposers.js`):

```javascript
canSkip: utils.canSkip
```

**Current Parameters** (from `app/utils/utils.js`):

```javascript
function canSkip (strictMode, postpone, passedPercent, postponePercent)
```

**Modified Signature** (REQUIRED):

```javascript
function canSkip (strictMode, postpone, passedPercent, postponePercent, 
                  skipDelayEnabled, skipDelayPassed)
```

**New Parameters**:

- `skipDelayEnabled` (Boolean): Whether skip delay feature is active
- `skipDelayPassed` (Boolean): Whether elapsed time >= skipDelayDuration

**Return Type**: Boolean (true if skip allowed, false otherwise)

**Backward Compatibility**: NOT REQUIRED (internal utility, all call sites updated simultaneously)

**Exposure**: NO CHANGE to context-bridge-exposers.js (still exposes utils.canSkip, signature change is transparent)

---

## No New IPC Channels Required

**Confirmation**: Skip delay feature uses only existing IPC patterns:

- ✅ `window.settings.get()` - read individual setting
- ✅ `window.settings.saveSettings()` - write individual setting  
- ✅ `window.settings.currentSettings()` - read all settings
- ✅ `window.utils.formatTimeRemaining()` - format time
- ✅ `window.utils.canSkip()` - check skip availability (signature updated but exposure unchanged)

**Security**: All IPC channels already secured via contextBridge in preload scripts. No new attack surface.

**Performance**: No additional IPC overhead (reuses existing settings read pattern at break initialization).

---

## Data Flow Sequence

### Preferences UI → Storage

```
User toggles skipDelayEnabled checkbox
  ↓
preferences-renderer.js: checkbox.onchange
  ↓
window.settings.saveSettings('skipDelayEnabled', true)
  ↓
[IPC via contextBridge]
  ↓
main.js: settings.set('skipDelayEnabled', true)
  ↓
electron-store: persist to disk
```

### Storage → Break Window

```
main.js triggers break window
  ↓
break-renderer.js: window.onload
  ↓
window.settings.get('skipDelayEnabled')
window.settings.get('skipDelayDuration')
  ↓
[IPC via contextBridge]
  ↓
main.js: settings.get('skipDelayEnabled')
main.js: settings.get('skipDelayDuration')
  ↓
Return values to renderer
  ↓
break-renderer.js: initialize countdown logic
```

### Break Window Runtime (No IPC)

```
setInterval(100ms)
  ↓
Calculate elapsedTime = Date.now() - started
  ↓
skipDelayPassed = elapsedTime >= skipDelayDuration
  ↓
canSkip(..., skipDelayEnabled, skipDelayPassed)
  ↓
Update DOM (skip button, countdown display)
  ↓
[All in renderer process - no IPC]
```

---

## Testing Considerations

### IPC Mocking (for unit tests)

**Not Required**: Skip delay logic is in utils.js (pure function). Can test canSkip() directly without IPC mocking.

**Integration Tests**: May need to mock window.settings.get() for break-renderer tests, but existing patterns already handle this.

---

## References

- Context Bridge: `app/utils/context-bridge-exposers.js`
- Settings IPC: `app/preferences-preload.mjs`, `app/break-preload.mjs`
- Main Process: `app/main.js` (electron-store initialization)
- Research: `specs/001-skip-delay/research.md` (Pattern 5: Skip Button Visibility Control)
