# Phase 1: Data Model

**Feature**: Strict Mode Skip Friction  
**Phase**: 1 (Design & Contracts)  
**Date**: December 10, 2025

## Overview

This document defines all data entities for the skip friction feature, including settings schema, counter state, and runtime data structures. All entities use existing electron-store persistence mechanism.

---

## Settings Entities

### 1. Mini Break Skip Friction Configuration

**Purpose**: Configure friction behavior for mini breaks (microbreaks) in strict mode.

**Storage**: electron-store (app/utils/defaultSettings.js)

**Schema**:

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `microbreakSkipFrictionEnabled` | Boolean | `true` | - | Enable/disable friction for mini breaks |
| `microbreakSkipFrictionCharLength` | Integer | `20` | min=1, max=50 | Character length per word |
| `microbreakSkipFrictionIncrementalEnabled` | Boolean | `true` | - | Enable incremental difficulty |
| `microbreakSkipFrictionMaxWords` | Integer | `5` | min=1, max=20 | Maximum words when incremental enabled |

**Relationships**:

- Requires `microbreakStrictMode: true` to be active (existing setting)
- Independent from long break friction settings

**Validation Rules**:

- `charLength` must be positive integer
- `maxWords` must be positive integer
- Settings only apply when both strict mode and friction enabled

**Example**:

```javascript
{
  microbreakSkipFrictionEnabled: true,
  microbreakSkipFrictionCharLength: 20,
  microbreakSkipFrictionIncrementalEnabled: true,
  microbreakSkipFrictionMaxWords: 5
}
```

---

### 2. Long Break Skip Friction Configuration

**Purpose**: Configure friction behavior for long breaks in strict mode.

**Storage**: electron-store (app/utils/defaultSettings.js)

**Schema**:

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `breakSkipFrictionEnabled` | Boolean | `true` | - | Enable/disable friction for long breaks |
| `breakSkipFrictionCharLength` | Integer | `20` | min=1, max=50 | Character length per word |
| `breakSkipFrictionIncrementalEnabled` | Boolean | `true` | - | Enable incremental difficulty |
| `breakSkipFrictionMaxWords` | Integer | `5` | min=1, max=20 | Maximum words when incremental enabled |

**Relationships**:

- Requires `breakStrictMode: true` to be active (existing setting)
- Independent from mini break friction settings

**Validation Rules**:

- `charLength` must be positive integer
- `maxWords` must be positive integer
- Settings only apply when both strict mode and friction enabled

**Example**:

```javascript
{
  breakSkipFrictionEnabled: true,
  breakSkipFrictionCharLength: 20,
  breakSkipFrictionIncrementalEnabled: true,
  breakSkipFrictionMaxWords: 5
}
```

---

### 3. Mini Break Skip Counters

**Purpose**: Track total and sequential skips for mini breaks.

**Storage**: electron-store (persisted in same settings file)

**Schema**:

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `microbreakSkipFrictionTotalCount` | Integer | `0` | min=0, max=9007199254740991 (Number.MAX_SAFE_INTEGER) | Total skips using friction |
| `microbreakSkipFrictionSequentialCount` | Integer | `0` | min=0, max=9007199254740991 (Number.MAX_SAFE_INTEGER) | Sequential skips without completion |

**State Transitions**:

```
Initial State: totalCount=0, sequentialCount=0

Event: User skips mini break with friction
  → totalCount++, sequentialCount++

Event: User completes mini break without skip
  → totalCount unchanged, sequentialCount=0

Event: User manually resets counter (preferences UI)
  → totalCount=0, sequentialCount unchanged

Event: Application restarts
  → Both counters persist (no change)
```

**Relationships**:

- Independent from long break counters
- `sequentialCount` drives incremental friction word count formula: `min(1 + sequentialCount, maxWords)`

**Validation Rules**:

- Counters cannot be negative
- Sequential count resets to 0 on break completion (not on skip)
- Total count only increments when friction was actually used (not for non-friction skips)

**Example**:

```javascript
// After 3 skips, then 1 completion, then 1 skip
{
  microbreakSkipFrictionTotalCount: 4,    // Total skips
  microbreakSkipFrictionSequentialCount: 1 // Reset after completion, now 1
}
```

---

### 4. Long Break Skip Counters

**Purpose**: Track total and sequential skips for long breaks.

**Storage**: electron-store (persisted in same settings file)

**Schema**:

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `breakSkipFrictionTotalCount` | Integer | `0` | min=0, max=9007199254740991 (Number.MAX_SAFE_INTEGER) | Total skips using friction |
| `breakSkipFrictionSequentialCount` | Integer | `0` | min=0, max=9007199254740991 (Number.MAX_SAFE_INTEGER) | Sequential skips without completion |

**State Transitions**: Same as mini break counters (see above).

**Relationships**:

- Independent from mini break counters
- `sequentialCount` drives incremental friction word count formula

**Validation Rules**: Same as mini break counters.

**Example**:

```javascript
// After 2 skips sequentially
{
  breakSkipFrictionTotalCount: 2,
  breakSkipFrictionSequentialCount: 2
}
```

---

## Runtime Entities (Not Persisted)

### 5. Friction String

**Purpose**: Random string generated for each skip attempt.

**Lifetime**: Created when friction UI displays, discarded on skip or cancel.

**Schema**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `targetString` | String or String[] | length=charLength or array of words | Generated random string(s) |
| `generatedAt` | Timestamp | - | When string was generated |

**Generation Rules**:

- **Without incremental friction**: Single string of length `charLength`
- **With incremental friction**: Array of strings, count = `min(1 + sequentialCount, maxWords)`, each of length `charLength`
- Character distribution: Balanced across 4 classes (numbers, lowercase, uppercase, special)
- Algorithm: Fisher-Yates shuffle (see research.md #1)

**Character Classes**:

- Numbers: `0123456789` (10 chars)
- Lowercase: `abcdefghijklmnopqrstuvwxyz` (26 chars)
- Uppercase: `ABCDEFGHIJKLMNOPQRSTUVWXYZ` (26 chars)
- Special: `!@#$%^&*()_+-=[]{}|;:,.<>?` (28 chars)

**Example**:

```javascript
// Without incremental (charLength=20)
{
  targetString: "A3!xB9@mC7#zD1$nE5%p",
  generatedAt: 1702156800000
}

// With incremental (sequentialCount=2, charLength=20)
// Layout: 3 words, each displayed as 2 rows (target + input) stacked vertically
{
  targetString: [
    "A3!xB9@mC7#zD1$nE5%p",  // Word 1 (rows 1-2)
    "F2&yG8*hH6^jI4(kJ0)l",  // Word 2 (rows 3-4)
    "K1+qL3-rM5=sN7[tO9]u"   // Word 3 (rows 5-6)
  ],
  generatedAt: 1702156800000
}
```

---

### 6. Validation State

**Purpose**: Track character-by-character correctness during input.

**Lifetime**: Created when friction UI displays, updated on every keystroke, discarded on skip or cancel.

**Schema**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `state` | Boolean[] | length matches targetString total chars | True if character correct |
| `allCorrect` | Boolean | - | Computed: all state values true |

**State Updates**:

```javascript
// Initial state (empty inputs)
state = [false, false, false, ...] // length = total chars

// After user types correct char at position 0
state = [true, false, false, ...]

// After user types incorrect char at position 1
state = [true, false, false, ...]

// After correcting position 1
state = [true, true, false, ...]

// All correct → skip button enabled
allCorrect = state.every(v => v === true)
```

**Example**:

```javascript
// Target: "A3!" (length 3)
// User typed: "A", "2", "" (empty)
{
  state: [true, false, false],
  allCorrect: false
}

// User corrects and completes: "A", "3", "!"
{
  state: [true, true, true],
  allCorrect: true
}
```

---

### 7. UI Component State

**Purpose**: Track visual state of friction interface.

**Lifetime**: Created when friction UI displays, discarded on skip or cancel.

**Schema**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `skipButtonVisible` | Boolean | - | Skip button display state |
| `columnStates` | String[] | enum: 'empty', 'correct', 'incorrect' | CSS class for each column |
| `totalCountDisplay` | Integer | - | Current total count for this break type |
| `sequentialCountDisplay` | Integer | - | Current sequential count for this break type |

**State Derivation**:

- `skipButtonVisible` = `allCorrect` (from Validation State)
- `columnStates[i]` = 'empty' if no input, 'correct' if state[i]=true, 'incorrect' if state[i]=false with input
- Count displays fetched from electron-store on UI load

**Example**:

```javascript
{
  skipButtonVisible: false,
  columnStates: ['correct', 'incorrect', 'empty'],
  totalCountDisplay: 5,
  sequentialCountDisplay: 2
}
```

---

## Data Flow Diagrams

### Skip with Friction Flow

```
1. User clicks "Skip" on break window (strict mode + friction enabled)
   ↓
2. Fetch settings: charLength, incrementalEnabled, maxWords, sequentialCount
   ↓
3. Generate targetString (1 or more words based on incremental)
   ↓
4. Render friction UI with targetString columns
   ↓
5. Initialize validationState = [false, false, ...]
   ↓
6. User types characters → update validationState on each keystroke
   ↓
7. When allCorrect = true → show skip button
   ↓
8. User clicks skip button
   ↓
9. Increment totalCount and sequentialCount in electron-store
   ↓
10. Close break window
```

### Break Completion Flow (No Skip)

```
1. User lets break timer complete (or clicks "Continue Break")
   ↓
2. Fetch current sequentialCount from electron-store
   ↓
3. Set sequentialCount = 0
   ↓
4. Persist to electron-store
   ↓
5. Close break window
```

---

## Persistence Strategy

### electron-store Integration

**File Location**: User data directory (platform-specific)

- Windows: `%APPDATA%\Stretchly\config.json`
- macOS: `~/Library/Application Support/Stretchly/config.json`
- Linux: `~/.config/Stretchly/config.json`

**Write Operations**:

```javascript
// Update single setting
await window.settings.set('microbreakSkipFrictionCharLength', 30)

// Update counter (increment)
const currentCount = await window.settings.get('microbreakSkipFrictionTotalCount')
await window.settings.set('microbreakSkipFrictionTotalCount', currentCount + 1)

// Reset counter
await window.settings.set('microbreakSkipFrictionTotalCount', 0)
```

**Read Operations**:

```javascript
// Fetch all friction settings for mini break
const enabled = await window.settings.get('microbreakSkipFrictionEnabled')
const charLength = await window.settings.get('microbreakSkipFrictionCharLength')
const incrementalEnabled = await window.settings.get('microbreakSkipFrictionIncrementalEnabled')
const maxWords = await window.settings.get('microbreakSkipFrictionMaxWords')
const sequentialCount = await window.settings.get('microbreakSkipFrictionSequentialCount')
```

**Atomicity**: electron-store guarantees atomic writes. Concurrent updates handled via async/await.

---

## Migration Considerations

### Existing Settings Compatibility

**No migration required** - all new settings have defaults in defaultSettings.js.

**First Launch Behavior**:

1. User upgrades to version with friction feature
2. electron-store merges defaults with existing user settings
3. Friction defaults to enabled (following UX goal of deliberate friction)
4. Counters initialize to 0

**Backward Compatibility**:

- If user disables friction, strict mode reverts to existing "no skip allowed" behavior
- No changes to non-strict mode skip behavior
- Skip delay feature (001-skip-delay) remains independent

---

## Summary

**Total Entities**: 7 (4 persistent settings groups + 3 runtime entities)

**Persistent Storage**:

- 12 settings fields (8 config + 4 counters)
- All stored in single electron-store config.json
- Total storage: ~200 bytes (negligible)

**Runtime Memory**:

- Validation state: O(n) where n = total characters (max 5000 chars = 5000 bytes)
- UI state: O(n) for column states (~5000 bytes max)
- Total runtime: <10KB even at maximum configuration

**Performance Impact**: Minimal. All operations O(1) except string generation O(n) which is <10ms.

---

## Next Steps

Proceed to creating contracts/ directory with:

1. `settings.md` - Full electron-store schema with all 12 fields
2. `ui-components.md` - HTML/CSS specifications for friction interface
3. `ipc.md` - Main/renderer communication contracts (if needed)
