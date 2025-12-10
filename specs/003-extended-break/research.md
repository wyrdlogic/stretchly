# Research Document: Extended Break Triggers

## Overview

This document consolidates research findings for implementing extended break duration triggers in Stretchly. All NEEDS CLARIFICATION items from the technical context have been resolved through codebase analysis.

---

## 1. Break Duration Override Integration Point

### Decision

Inject duration override in `BreaksPlanner.on('breakStarted')` event handler before creating the break duration scheduler.

### Rationale

- Current pattern: `const interval = this.settings.get('breakDuration')` retrieves static duration
- This is the single point where break duration is read before starting the break timer
- Minimal code change required - replace static duration with computed duration from trigger evaluation
- Maintains event-driven architecture - no changes to Scheduler class needed
- Preserves existing break lifecycle events and state management

### Implementation Strategy

```javascript
// Current code (line 26 in breaksPlanner.js)
this.on('breakStarted', (shouldPlaySound) => {
  const interval = this.settings.get('breakDuration')
  this.scheduler = new Scheduler(() => this.emit('finishBreak', shouldPlaySound, true), interval, 'finishBreak')
  this.scheduler.plan()
})

// Proposed change
this.on('breakStarted', (shouldPlaySound) => {
  const interval = this._getBreakDuration()  // New method evaluates triggers
  this.scheduler = new Scheduler(() => this.emit('finishBreak', shouldPlaySound, true), interval, 'finishBreak')
  this.scheduler.plan()
}

_getBreakDuration () {
  const baseDuration = this.settings.get('breakDuration')
  const overrideDuration = this._evaluateExtendedBreakTriggers()
  return overrideDuration || baseDuration
}
```

### Alternatives Considered

- **Option 1**: Modify Scheduler class to accept dynamic duration
  - Rejected: Violates single responsibility, affects all scheduler usages
- **Option 2**: Override duration in settings before break starts
  - Rejected: Settings mutation complicates state tracking, harder to test
- **Option 3**: Add duration parameter to 'breakStarted' event
  - Rejected: Breaking change to event contract, affects main.js and other listeners

---

## 2. Settings Persistence Schema Extension

### Decision

Add new settings key `extendedBreakTriggers` as an array of trigger objects. Use electron-store's built-in JSON serialization.

### Rationale

- Existing pattern: Complex data structures stored as arrays (e.g., `breakIdeas`, `appExclusions`)
- electron-store handles JSON serialization automatically - no custom marshaling needed
- Default value in defaultSettings.js: empty array `[]`
- Backward compatibility: Existing installations get empty array on first access
- Validation performed in BreaksPlanner constructor, not in storage layer

### Schema Structure

```javascript
// In defaultSettings.js
export default {
  // ... existing settings ...
  extendedBreakTriggers: []
}

// Trigger object structure
{
  id: 'string (UUID)',               // Unique identifier
  enabled: true,                      // Active flag
  type: 'time-of-day' | 'break-count', // Trigger type
  timeOfDay: '14:30',                 // Required for time-of-day type (HH:mm format)
  breakCount: 5,                      // Required for break-count type (min: 2)
  duration: 600000                    // Override duration in milliseconds
}
```

### Validation Rules

- `type`: Must be one of `['time-of-day', 'break-count']`
- `timeOfDay`: Required when `type='time-of-day'`, format `/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/`
- `breakCount`: Required when `type='break-count'`, integer >= 2
- `duration`: Positive integer in milliseconds, no maximum limit (per clarification Q4)
- `id`: Generated on creation, UUID v4 format
- `enabled`: Boolean, defaults to true

### Migration Strategy

- No migration needed - new setting starts as empty array
- First version check: `if (!Array.isArray(settings.get('extendedBreakTriggers')))` → set to `[]`

---

## 3. Midnight Reset Mechanism

### Decision

Use Node.js `Date` comparisons in `_evaluateExtendedBreakTriggers()` to detect date changes. No background timers required.

### Rationale

- Time-of-day triggers evaluate on every break, not continuously
- Comparison pattern: Store last evaluation date, compare `new Date().toDateString()` on each check
- Day boundary detection handles all edge cases (DST, leap seconds, system time changes)
- No performance impact - evaluation happens only when break starts (~every 30-60 minutes)
- Survives computer sleep - evaluation occurs after wake, detects date change naturally

### Implementation Pattern

```javascript
class BreaksPlanner extends EventEmitter {
  constructor (settings) {
    super()
    this.lastTriggerEvaluationDate = new Date().toDateString()
    this.triggeredTodayIds = new Set()
  }

  _evaluateExtendedBreakTriggers () {
    const currentDate = new Date().toDateString()
    
    // Reset daily state if day changed
    if (currentDate !== this.lastTriggerEvaluationDate) {
      this.triggeredTodayIds.clear()
      this.lastTriggerEvaluationDate = currentDate
    }

    // Evaluate time-of-day triggers...
  }
}
```

### Edge Cases Handled

- **Computer sleep**: `toDateString()` reflects current date after wake
- **System time changes**: Date object uses system clock, auto-adjusts
- **DST transitions**: `toDateString()` normalizes to local date, DST-agnostic
- **Midnight restart**: Constructor initializes to current date on startup

### Alternatives Considered

- **Option 1**: Daily cron-like timer at midnight
  - Rejected: Wasteful if computer asleep, adds complexity
- **Option 2**: Store last trigger timestamp, compare `Date.now() - 86400000`
  - Rejected: Fails with system time changes, DST transitions

---

## 4. Idle Time Integration

### Decision

Extended breaks cancel if computer goes idle during the break. No integration needed in trigger evaluation logic.

### Rationale

- Existing behavior: `NaturalBreaksManager.emit('clearBreakScheduler')` when idle > `naturalBreaksInactivityResetTime` (default 5 minutes)
- BreaksPlanner already handles this event → cancels current scheduler → calls `clear()` → resets state
- Extended break duration uses same `Scheduler` instance → automatically cancelled by existing idle detection
- No changes needed to NaturalBreaksManager or idle detection logic
- Trigger state (consecutive break count) preserved - idle only cancels current break, not progress

### Existing Flow (No Changes Needed)

```javascript
// In breaksPlanner.js (lines 33-37) - already handles idle during breaks
this.naturalBreaksManager.on('clearBreakScheduler', () => {
  if (!this.isPaused && this.scheduler.reference !== 'finishMicrobreak' && 
      this.scheduler.reference !== 'finishBreak' && this.scheduler.reference !== null) {
    this.clear()  // Cancels scheduler, resets breakNumber
  }
})
```

### Trigger State Management

- **Time-of-day triggers**: Idle cancels extended break, but trigger remains "used today" → prevents re-triggering later same day (per FR-018)
- **Break-count triggers**: Idle cancels break → `clear()` resets `breakNumber` to 0 → consecutive count restarts (per FR-019)

### Test Cases Required

- Verify extended break (e.g., 15 minutes) cancels after 5 minutes idle
- Verify time-of-day trigger doesn't re-fire after idle cancellation
- Verify break-count trigger resets consecutive count after idle

---

## 5. Multiple Trigger Conflict Resolution

### Decision

"Longest duration wins" strategy - evaluate all enabled triggers, return maximum duration and collect all matching trigger information for display.

### Rationale

- Simplest conflict resolution (per clarification Q3)
- User intent: Configure multiple scenarios for longer breaks
- No priority system needed - duration is inherent priority
- Deterministic behavior - same triggers always produce same result
- When multiple triggers match (including ties with equal duration), all trigger information is shown in break window (per FR-008)

### Implementation

```javascript
_evaluateExtendedBreakTriggers () {
  const triggers = this.settings.get('extendedBreakTriggers')
  const enabledTriggers = triggers.filter(t => t.enabled)
  
  let maxDuration = null
  const matchingTriggers = []
  
  for (const trigger of enabledTriggers) {
    const duration = this._evaluateTrigger(trigger)
    if (duration !== null) {
      if (maxDuration === null || duration > maxDuration) {
        maxDuration = duration
        matchingTriggers.length = 0
        matchingTriggers.push(trigger)
      } else if (duration === maxDuration) {
        matchingTriggers.push(trigger)
      }
    }
  }
  
  return { duration: maxDuration, triggers: matchingTriggers }
}
```

### Example Scenarios

- Trigger A (time-of-day: 14:00, 10 min) + Trigger B (count: 3, 15 min) both active → 15 minutes used, shows "triggered by: Consecutive breaks (3)"
- Trigger C (time-of-day: 09:00, 10 min) + Trigger D (count: 5, 10 min) both active → 10 minutes used, shows "triggered by: Time (09:00), Consecutive breaks (5)" (both equal duration)
- Trigger E (time-of-day: 09:00, 20 min) + Trigger F (time-of-day: 09:30, 5 min) both active at 09:15 → 20 minutes, shows "triggered by: Time (09:00)" (only E triggered)
- No triggers active → returns `{ duration: null, triggers: [] }`, falls back to default `breakDuration`

---

## 6. Break Type Filtering (Long Breaks Only)

### Decision

Only evaluate triggers when `_scheduledBreakType === 'break'`. Microbreaks always use default duration.

### Rationale

- Microbreak duration is by definition short (default 20 seconds) → extension contradicts purpose
- User clarification Q6: Long breaks only to prevent logical contradiction
- Implementation: Check break type before trigger evaluation

### Implementation

```javascript
_getBreakDuration () {
  const baseDuration = this.settings.get('breakDuration')
  
  // Only check triggers for long breaks, not microbreaks
  if (this._scheduledBreakType !== 'break') {
    return baseDuration
  }
  
  const overrideDuration = this._evaluateExtendedBreakTriggers()
  return overrideDuration || baseDuration
}
```

### Edge Case

- User disables microbreaks (`microbreak: false`) → all breaks are long breaks → triggers always evaluate
- User disables long breaks (`break: false`) → all breaks are microbreaks → triggers never evaluate (expected)

---

## 7. UI Integration Patterns

### Decision

Add new section to `preferences.html` using existing range input pattern. Follow data-divisor convention for time units.

### Rationale

- Existing pattern: Duration settings use `<input type="range">` with `data-divisor` attribute
- Example: `microbreakDuration` has `data-divisor="1000"` (converts ms to seconds for display)
- Extended break triggers need custom UI (add/edit/delete table), not simple range input
- Place after existing break settings section for logical grouping

### UI Component Structure

```html
<!-- In preferences.html, after break settings -->
<div class="preferences-box">
  <h3 data-i18n="extendedBreakTriggers"></h3>
  <div id="extendedBreakTriggersContainer">
    <table id="extendedBreakTriggersTable">
      <!-- Dynamic rows added via renderer -->
    </table>
    <button id="addExtendedBreakTrigger" data-i18n="addTrigger"></button>
  </div>
</div>
```

### Renderer Integration

- Follow pattern in `preferences-renderer.js`: `settings.get('extendedBreakTriggers')` → populate table
- Add/edit/delete buttons trigger IPC messages to main process → update settings
- Validation in renderer before sending (time format, count >= 2, duration > 0)

### i18n Keys Required

- `extendedBreakTriggers`: "Extended Break Triggers"
- `addTrigger`: "Add Trigger"
- `triggerType`: "Type"
- `triggerTimeOfDay`: "Time of Day (HH:mm)"
- `triggerBreakCount`: "After Consecutive Breaks"
- `triggerDuration`: "Extended Duration"
- `triggerEnabled`: "Enabled"

---

## 8. Testing Strategy

### Decision

Use Vitest with existing patterns. Test trigger evaluation logic in isolation, integration tests for BreaksPlanner.

### Rationale

- Existing test files in `test/` use Vitest + chai assertions
- Pattern: Export helper functions separately, test independently from class
- Mock electron-store settings using in-memory object
- Mock Scheduler to verify correct duration passed

### Test File Structure

```javascript
// test/extendedBreakTriggers.js
import { describe, it, expect } from 'vitest'
import { evaluateTrigger, shouldResetDailyState } from '../app/utils/extendedBreakTriggers.js'

describe('Extended Break Triggers', () => {
  describe('Time-of-day trigger evaluation', () => {
    it('triggers when current time matches configured time', () => {
      // Test implementation
    })
    
    it('does not trigger twice on same day', () => {
      // Test implementation
    })
  })
  
  describe('Break-count trigger evaluation', () => {
    it('triggers when consecutive count matches', () => {
      // Test implementation
    })
    
    it('resets count after idle cancellation', () => {
      // Test implementation
    })
  })
})
```

### Test Coverage Requirements

- Time-of-day parsing and matching
- Break-count consecutive tracking
- Midnight reset detection
- Multiple trigger conflict resolution (longest wins)
- Idle cancellation behavior
- Settings persistence and retrieval

---

## 9. Best Practices for Event-Driven Architecture

### Decision

Maintain existing EventEmitter patterns. Do not add new events for trigger evaluation - keep it internal to BreaksPlanner.

### Rationale

- Stretchly uses EventEmitter extensively for decoupled component communication
- Pattern: BreaksPlanner emits events (`breakStarted`, `finishBreak`, `updateToolTip`) → main.js listens
- Trigger evaluation is internal decision-making, not cross-component communication
- No external components need to know which trigger fired or duration used

### Events NOT Needed

- ❌ `extendedBreakTriggered` - no external consumers
- ❌ `triggerEvaluated` - adds noise, no value
- ❌ `durationOverridden` - implementation detail

### Events to Preserve

- ✅ `breakStarted` - already exists, continues to work
- ✅ `finishBreak` - already exists, continues to work
- ✅ `updateToolTip` - already exists, may need tooltip text update to show extended duration

### Logging Strategy

- Use electron-log for trigger evaluation (matches existing pattern)
- Example: `log.info('Stretchly: extended break triggered (time-of-day: 14:00), duration: 10min')`
- Log level: info (not debug) for visibility in user logs

---

## 10. Cross-Platform Considerations

### Decision

Use standard JavaScript Date/Time APIs only. No platform-specific time APIs needed.

### Rationale

- Node.js Date object works identically on Windows, macOS, Linux
- No timezone conversion needed - user configures time-of-day in local time
- Electron's powerMonitor (already used for idle detection) is cross-platform
- No native modules required - pure JavaScript implementation

### Platform-Specific Behavior

- **Windows**: Date.toDateString() uses system locale, works correctly
- **macOS**: Same behavior as Windows
- **Linux**: Same behavior as Windows
- **Sleep/wake**: All platforms update Date object after wake (verified in NaturalBreaksManager usage)

### No Changes Needed

- App already handles cross-platform differences in main.js and platform.js
- Extended break feature uses no platform-specific APIs

---

## Summary of Resolved Unknowns

| Unknown | Resolution | Source |
|---------|-----------|--------|
| Break duration injection point | `on('breakStarted')` event handler | breaksPlanner.js:26 |
| Settings schema extension | Add `extendedBreakTriggers: []` to defaultSettings.js | Existing pattern in defaultSettings.js |
| Midnight reset mechanism | Compare `Date.toDateString()` on each evaluation | Native Date API |
| Idle detection integration | No changes needed, existing clearBreakScheduler event handles it | breaksPlanner.js:33-37 |
| Multiple trigger resolution | Longest duration wins, iterate all enabled triggers | Clarification Q3 |
| Break type filtering | Check `_scheduledBreakType === 'break'` | breaksPlanner.js:_scheduledBreakType getter |
| UI integration pattern | Follow range input pattern, add table for trigger management | preferences.html existing patterns |
| Testing framework usage | Vitest + chai, test helper functions separately | test/*.js existing files |
| Event-driven architecture | No new events, keep evaluation internal to BreaksPlanner | EventEmitter usage in codebase |
| Cross-platform compatibility | Standard Date API, no platform-specific code needed | Node.js cross-platform by default |

---

## Next Steps

Proceed to Phase 1:

1. Generate `data-model.md` defining ExtendedBreakTrigger entity schema
2. Generate API contracts in `/contracts/` for trigger CRUD operations
3. Update `quickstart.md` with implementation steps
4. Update agent context file
