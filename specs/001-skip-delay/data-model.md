# Data Model: Configurable Skip Delay

**Feature**: 001-skip-delay  
**Date**: 2025-12-09  
**Purpose**: Define entities, state, and data relationships for skip delay feature

## Overview

Skip delay feature introduces two persistent settings and two runtime state elements. Data model is intentionally simple, leveraging Stretchly's existing electron-store settings pattern.

## Entities

### 1. Skip Delay Enable State (Persistent Setting)

**Purpose**: Controls whether skip delay feature is active

**Storage**: electron-store key `skipDelayEnabled`

**Type**: Boolean

**Default**: `false` (disabled by default per spec requirement)

**Validation**: None (boolean type enforced by electron-store)

**Access Pattern**:

- Read: At break window initialization to determine if delay should be enforced
- Write: When user toggles checkbox in preferences UI

**Lifecycle**: Persisted across application restarts, survives preferences reset (will revert to default false)

**Relationships**:

- Controls visibility/enabled state of `skipDelayDuration` input in preferences UI
- Determines whether `canSkip()` function considers delay logic

---

### 2. Skip Delay Duration (Persistent Setting)

**Purpose**: Defines how many milliseconds skip button remains disabled when feature is enabled

**Storage**: electron-store key `skipDelayDuration`

**Type**: Number (milliseconds)

**Default**: `30000` (30 seconds)

**Validation**:

- When `skipDelayEnabled === true`: Range 1000-300000 (1-300 seconds)
- When `skipDelayEnabled === false`: No validation (input disabled, value stored but not used)

**Access Pattern**:

- Read: At break window initialization to start countdown timer
- Write: When user changes range slider in preferences UI

**Lifecycle**: Persisted across application restarts, survives preferences reset (will revert to default 30000)

**Relationships**:

- Used only when `skipDelayEnabled === true`
- Determines countdown duration for both microbreaks and long breaks (single setting applies to both)

**Display Conversion**:

- Stored in milliseconds (backend unit)
- Displayed in seconds (UI unit)
- Conversion via HTML data-divisor="1000" attribute

---

### 3. Skip Delay Elapsed Time (Runtime State)

**Purpose**: Tracks how much time has passed since break window appeared, to determine when skip button should become available

**Storage**: In-memory calculation (not persisted)

**Type**: Number (milliseconds)

**Calculation**: `Date.now() - started` (where `started` is break start timestamp from main process)

**Validation**: None (derived value)

**Access Pattern**:

- Read: Every 100ms by break window setInterval
- Write: N/A (calculated, not set)

**Lifecycle**: Exists only during active break window, reset when break window closes

**Relationships**:

- Compared against `skipDelayDuration` to determine skip button availability
- Used to calculate remaining countdown time: `skipDelayDuration - elapsedTime`

**Edge Cases**:

- System sleep/resume: Uses wall-clock time (Date.now()), so calculation remains accurate
- Break postponed: Reset when postponed break re-triggers (new `started` timestamp)

---

### 4. Skip Button Availability (Runtime State)

**Purpose**: Determines whether skip button is visible/enabled in break window

**Storage**: DOM element class (classList.contains('hidden'))

**Type**: Boolean (derived)

**Calculation**: Result of `canSkip()` function with parameters:

```javascript
canSkip(strictMode, postpone, passedPercent, postponePercent, skipDelayEnabled, skipDelayPassed)
```

Where `skipDelayPassed = (elapsedTime >= skipDelayDuration)`

**Validation**: None (derived state)

**Access Pattern**:

- Read: N/A (visual state only)
- Write: Every 100ms by break window setInterval

**Lifecycle**: Transitions during break window from disabled → enabled when all conditions met

**State Transitions**:

1. **Initial State** (break starts):
   - If `skipDelayEnabled === false`: Immediately available (unless strict mode or postpone window)
   - If `skipDelayEnabled === true`: Disabled (hidden)

2. **During Countdown** (skipDelayEnabled && elapsedTime < skipDelayDuration):
   - Disabled (hidden)
   - Countdown display visible

3. **Delay Expired** (elapsedTime >= skipDelayDuration):
   - Enabled (visible), assuming no other restrictions (strict mode, postpone window)
   - Countdown display hidden

**Relationships**:

- Depends on: `skipDelayEnabled`, `skipDelayDuration`, `elapsedTime`, `strictMode`, `postpone`, break duration
- Controls: CSS class 'hidden' on `#close` element

---

### 5. Skip Countdown Display (Runtime State, MANDATORY)

**Purpose**: Shows remaining seconds until skip button becomes available (MANDATORY when delay active per spec FR-011)

**Storage**: DOM element textContent (span#skip-countdown)

**Type**: String (formatted time)

**Calculation**:

```javascript
formatTimeRemaining(skipDelayDuration - elapsedTime, locale)
```

**Validation**: Must be displayed when `skipDelayEnabled === true` AND `elapsedTime < skipDelayDuration` (MANDATORY requirement)

**Access Pattern**:

- Read: N/A (visual display only)
- Write: Every 100ms by break window setInterval (at minimum once per second for user perception)

**Lifecycle**:

- Visible during countdown period
- Hidden after delay expires or feature disabled

**Display Format**: Uses existing `formatTimeRemaining()` utility:

- Examples: "29 seconds", "1 minute 15 seconds", "5 minutes"
- Localized via i18next based on user's selected language

**Accessibility**:

- Has `aria-hidden="true"` to prevent screen reader spam (per existing timer pattern)
- Visual-only feedback

**Relationships**:

- Visibility depends on `skipDelayEnabled` and `elapsedTime < skipDelayDuration`
- Content depends on `skipDelayDuration - elapsedTime` calculation

---

## Data Flow Diagram

```text
[User Preferences UI]
        |
        | (onchange)
        v
[electron-store] ──────────────────────────────────┐
  ├─ skipDelayEnabled: boolean (default: false)    |
  └─ skipDelayDuration: number (default: 30000)    |
                                                    | (IPC)
                                                    v
[Break Window Initialization] ─────────> [settings.get('skipDelayEnabled')]
        |                                 [settings.get('skipDelayDuration')]
        | started = timestamp                       |
        v                                           v
[setInterval 100ms] ────────────────────────────────┘
        |
        | Calculate: elapsedTime = Date.now() - started
        |            skipDelayPassed = elapsedTime >= skipDelayDuration
        |
        v
[canSkip(strictMode, postpone, ..., skipDelayEnabled, skipDelayPassed)]
        |
        ├─> [Update skip button visibility] (#close element classList)
        └─> [Update countdown display] (#skip-countdown textContent)
```

## State Transition Table

| skipDelayEnabled | elapsedTime | strictMode | Skip Button | Countdown Display |
|-----------------|-------------|------------|-------------|-------------------|
| false           | any         | false      | ✅ Visible   | ❌ Hidden         |
| false           | any         | true       | ❌ Hidden    | ❌ Hidden         |
| true            | < duration  | false      | ❌ Hidden    | ✅ Visible (MANDATORY) |
| true            | < duration  | true       | ❌ Hidden    | ✅ Visible (MANDATORY) |
| true            | >= duration | false      | ✅ Visible   | ❌ Hidden         |
| true            | >= duration | true       | ❌ Hidden    | ❌ Hidden         |

**Note**: Postpone window logic (not shown in table) also affects skip button visibility, following same pattern as strict mode.

## Validation Rules

### Settings Validation (Preferences UI)

1. **skipDelayEnabled Toggle**:
   - Type: Boolean checkbox
   - No validation (always valid)
   - Side effect: Disables/enables `skipDelayDuration` input

2. **skipDelayDuration Range** (when enabled):
   - Minimum: 1 second (1000 milliseconds)
   - Maximum: 300 seconds (300000 milliseconds)
   - Step: 1 second (1000 milliseconds)
   - Type: Integer
   - HTML5 validation: `<input type="range" min="1" max="300" step="1">`
   - Backend storage: Multiply by 1000 (seconds → milliseconds)

3. **skipDelayDuration Input State** (when disabled):
   - Input disabled (grayed out)
   - Value persisted but not enforced
   - No validation performed

### Runtime Validation (Break Window)

1. **Countdown Must Display** (when applicable):
   - MANDATORY when: `skipDelayEnabled === true AND elapsedTime < skipDelayDuration`
   - Failure to display is critical bug (spec requirement FR-011)

2. **Skip Button State**:
   - Must respect strict mode (takes precedence over skip delay)
   - Must respect postpone window (takes precedence over skip delay)
   - Must respect delay when enabled

## Edge Case Handling

### 1. System Sleep/Resume

**Scenario**: User suspends system during skip delay countdown

**Data Impact**:

- `started` timestamp: Unchanged (Date from before sleep)
- Current time: Advanced by sleep duration
- `elapsedTime` calculation: Correctly reflects wall-clock time including sleep

**Behavior**: Countdown calculation remains accurate (may show 0 seconds or skip available if sleep > remaining delay)

**Implementation**: No special handling needed (Date.now() - started pattern handles this)

---

### 2. Delay > Break Duration

**Scenario**: User sets skipDelayDuration to 300 seconds but break duration is 20 seconds

**Data Impact**:

- Break naturally ends before delay expires
- Skip button never becomes available (not a problem, break ends anyway)

**Behavior**: Skip button remains hidden for entire break, countdown shows decreasing time, break window closes at break duration

**Implementation**: Spec requirement FR-017 - skip available after delay OR break duration, whichever comes first

---

### 3. Feature Disabled During Active Countdown

**Scenario**: User disables skipDelayEnabled while a break countdown is active

**Data Impact**:

- `skipDelayEnabled` changes from true to false in electron-store
- Current break window still has old setting cached

**Behavior**: Current break completes with original delay setting; new setting applies to next break

**Implementation**: Settings read at break initialization only, not during active break

---

### 4. Feature Enabled with Zero Delay Attempted

**Scenario**: User attempts to set duration to 0 when feature is enabled

**Data Impact**: Input rejected by HTML5 validation (min="1")

**Behavior**: Range slider cannot be moved to 0; minimum value is 1 second

**Implementation**: HTML5 native validation prevents invalid input

---

## Migration Strategy

### Existing Users (Upgrade from v1.19.0 → v1.20.0)

**Data Changes**:

- New settings added to electron-store schema
- Existing settings unchanged

**Default Behavior**:

- `skipDelayEnabled`: false (feature disabled, backward compatible)
- `skipDelayDuration`: 30000 (value shown in UI but not enforced)

**User Impact**:

- Zero change to existing behavior (feature disabled by default)
- Users must opt-in to skip delay via preferences

**Migration Code**: None needed (electron-store handles defaults automatically)

---

## Testing Data Scenarios

1. **Default State** (new installation):
   - skipDelayEnabled: false
   - skipDelayDuration: 30000
   - Expected: Skip immediately available (current behavior)

2. **Enabled with Default Duration**:
   - skipDelayEnabled: true
   - skipDelayDuration: 30000
   - Expected: Skip unavailable for 30 seconds, countdown displayed

3. **Minimum Delay**:
   - skipDelayEnabled: true
   - skipDelayDuration: 1000 (1 second)
   - Expected: Skip unavailable for 1 second, countdown displays "1 second"

4. **Maximum Delay**:
   - skipDelayEnabled: true
   - skipDelayDuration: 300000 (5 minutes)
   - Expected: Skip unavailable for 5 minutes (if break lasts that long)

5. **Strict Mode Override**:
   - skipDelayEnabled: true
   - microbreakStrictMode: true
   - Expected: Skip always hidden (strict mode takes precedence)

6. **System Sleep During Countdown**:
   - skipDelayEnabled: true
   - skipDelayDuration: 30000
   - Sleep for 60 seconds at 10 seconds elapsed
   - Expected: Upon resume, countdown shows 0 or skip available (70 seconds total elapsed)

---

## References

- Feature Spec: `specs/001-skip-delay/spec.md`
- Research: `specs/001-skip-delay/research.md`
- Existing Settings: `app/utils/defaultSettings.js`
- Break Window State: `app/break-renderer.js`, `app/microbreak-renderer.js`
