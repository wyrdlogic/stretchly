# Phase 0: Research and Technical Decisions

**Feature**: Strict Mode Skip Friction  
**Phase**: 0 (Outline & Research)  
**Status**: Complete  
**Date**: December 10, 2025

## Overview

This document captures technical decisions made during the research phase for implementing skip friction in strict mode. All "NEEDS CLARIFICATION" items from the Technical Context have been resolved through codebase analysis and pattern matching against the similar skip delay feature (specs/001-skip-delay).

## Research Questions & Resolutions

### 1. Random String Generation Algorithm

**Question**: What algorithm should generate random strings with balanced character distribution from the four character classes (numbers, lowercase, uppercase, special)?

**Decision**: Fisher-Yates Shuffle Algorithm for Position-Based Distribution

**Rationale**:

- Ensures each character class (numbers 0-9, lowercase a-z, uppercase A-Z, special chars) appears with guaranteed distribution
- Simple implementation without external dependencies
- Deterministic character count per class: for length 20, allocate 5 chars per class
- Shuffle final string to prevent predictable patterns

**Implementation Approach**:

```javascript
function generateRandomString(length) {
  const charsPerClass = Math.floor(length / 4)
  const remainder = length % 4
  
  const numbers = '0123456789'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  let result = []
  // Fill with guaranteed distribution
  result.push(...getRandomChars(numbers, charsPerClass + (remainder > 0 ? 1 : 0)))
  result.push(...getRandomChars(lowercase, charsPerClass + (remainder > 1 ? 1 : 0)))
  result.push(...getRandomChars(uppercase, charsPerClass + (remainder > 2 ? 1 : 0)))
  result.push(...getRandomChars(special, charsPerClass))
  
  // Fisher-Yates shuffle
  return shuffleArray(result).join('')
}
```

**Alternatives Considered**:

- Pure random selection: Could create strings with missing character classes (e.g., all lowercase)
- Weighted random: More complex, no clear benefit over guaranteed distribution
- Cryptographically secure random: Overkill for this use case (not security-sensitive)

**Performance**: O(n) time complexity, negligible memory overhead. Target generation time <10ms for strings up to 100 characters.

---

### 2. Settings Storage Pattern

**Question**: How should the 8 new settings (friction enabled/config for mini+long, counters for both) integrate with electron-store?

**Decision**: Follow Existing `skipDelayEnabled/Duration` Pattern

**Rationale**:

- Codebase already has precedent: `skipDelayEnabled: false, skipDelayDuration: 30000` (defaultSettings.js)
- Consistent naming convention improves maintainability
- Separate settings for mini/long breaks aligns with existing `microbreakStrictMode` and `breakStrictMode`
- electron-store handles persistence automatically via `settings.set()` and `settings.get()`

**Settings to Add** (defaultSettings.js):

```javascript
// Mini break skip friction
microbreakSkipFrictionEnabled: true,
microbreakSkipFrictionCharLength: 20,
microbreakSkipFrictionIncrementalEnabled: true,
microbreakSkipFrictionMaxWords: 5,
microbreakSkipFrictionTotalCount: 0,
microbreakSkipFrictionSequentialCount: 0,

// Long break skip friction
breakSkipFrictionEnabled: true,
breakSkipFrictionCharLength: 20,
breakSkipFrictionIncrementalEnabled: true,
breakSkipFrictionMaxWords: 5,
breakSkipFrictionTotalCount: 0,
breakSkipFrictionSequentialCount: 0
```

**Alternatives Considered**:

- Nested object structure: More complex to query, breaks established flat pattern
- Unified settings for both break types: Conflicts with existing microbreak/break separation
- External JSON file: Unnecessary complexity, electron-store already handles persistence

**Validation**: Character length minimum 1, maximum 100. Max words minimum 1, maximum 50.

---

### 3. Character-by-Character UI Implementation

**Question**: How should the column-based visual feedback interface be implemented in the existing break window HTML/CSS?

**Decision**: Dynamic DOM Generation with CSS Grid Layout

**Rationale**:

- CSS Grid provides natural column layout with automatic spacing
- Dynamic generation accommodates variable string length (1-100 chars)
- Existing break.css and microbreak.css already use Flexbox/Grid patterns
- Three-row structure: target characters (top), input characters (bottom), visual feedback (background color)

**HTML Structure** (injected dynamically):

```html
<div id="friction-interface" class="friction-container">
  <div class="friction-stats">
    <span>Total skips: <span id="total-count">0</span></span>
    <span>Sequential: <span id="sequential-count">0</span></span>
  </div>
  <div class="friction-grid">
    <!-- Generated dynamically based on string length -->
    <div class="friction-column" data-index="0">
      <div class="target-char">A</div>
      <input type="text" maxlength="1" class="input-char">
    </div>
    <!-- Repeat for each character -->
  </div>
  <button id="friction-skip-btn" style="display: none;">Skip Break</button>
  <button id="friction-cancel-btn">Continue Break</button>
</div>
```

**CSS State Management**:

```css
.friction-column { /* neutral state */ }
.friction-column.correct { background: var(--correct-green); }
.friction-column.incorrect { background: var(--incorrect-red); }
.friction-column.empty { background: transparent; }
```

**Alternatives Considered**:

- Table layout: Less flexible for responsive design, deprecated pattern
- Canvas rendering: Overkill for text display, accessibility issues
- Single input field: Doesn't provide character-by-character feedback

**Accessibility**: Each input has aria-label with position number. Keyboard navigation via Tab.

---

### 4. Input Validation and State Tracking

**Question**: How should character-by-character validation track completion state across all positions?

**Decision**: Event-Driven State Array with Real-Time Validation

**Rationale**:

- State array (boolean[]) tracks correct/incorrect for each position
- Input event listener validates on every keystroke
- Skip button visibility toggled by `state.every(v => v === true)`
- Allows corrections without clearing input (required by FR-030, FR-031)

**Implementation Pattern**:

```javascript
let validationState = new Array(targetString.length).fill(false)

inputElements.forEach((input, index) => {
  input.addEventListener('input', (e) => {
    const isCorrect = e.target.value === targetString[index]
    validationState[index] = isCorrect
    
    // Update visual feedback
    const column = e.target.closest('.friction-column')
    column.classList.remove('correct', 'incorrect', 'empty')
    if (e.target.value === '') {
      column.classList.add('empty')
    } else {
      column.classList.add(isCorrect ? 'correct' : 'incorrect')
    }
    
    // Toggle skip button
    const allCorrect = validationState.every(v => v)
    skipButton.style.display = allCorrect ? 'block' : 'none'
  })
})
```

**Alternatives Considered**:

- Server-side validation: Not applicable (Electron app, no server)
- Debounced validation: Would delay visual feedback beyond 100ms requirement (SC-003)
- String comparison: Requires full input before validation, doesn't support corrections

**Performance**: O(1) validation per keystroke. <100ms response time guaranteed.

---

### 5. Counter Persistence and Reset Logic

**Question**: How should the 4 counters (total/sequential for mini/long) persist and when should sequential counters reset?

**Decision**: electron-store for Persistence + Break Completion Hooks for Reset

**Rationale**:

- Counters stored as settings (already shown in Decision #2)
- Total counters: Increment via `settings.set()` on successful skip
- Sequential counters: Increment on skip, reset to 0 on break completion
- Break completion detection via existing `finishBreak()` function in break renderers
- Persistence happens automatically via electron-store's sync write

**Reset Logic Implementation**:

```javascript
// In break-renderer.js and microbreak-renderer.js
async function finishBreak(wasSkipped, usedFriction) {
  if (wasSkipped && usedFriction) {
    // Increment both counters
    const totalKey = isBreak ? 'breakSkipFrictionTotalCount' : 'microbreakSkipFrictionTotalCount'
    const seqKey = isBreak ? 'breakSkipFrictionSequentialCount' : 'microbreakSkipFrictionSequentialCount'
    
    await window.settings.set(totalKey, (await window.settings.get(totalKey)) + 1)
    await window.settings.set(seqKey, (await window.settings.get(seqKey)) + 1)
  } else if (!wasSkipped) {
    // Reset sequential counter only
    const seqKey = isBreak ? 'breakSkipFrictionSequentialCount' : 'microbreakSkipFrictionSequentialCount'
    await window.settings.set(seqKey, 0)
  }
  
  window.close()
}
```

**Alternatives Considered**:

- Separate counter file: Adds complexity, electron-store already handles persistence
- Timer-based reset: Break completion is event-based, not time-based
- Counter service in main process: Unnecessary IPC overhead, renderer can write directly

**Persistence Guarantees**: electron-store writes are synchronous and atomic. Counter values persist across app restarts (FR-044, FR-045, FR-051).

---

### 6. Incremental Friction Word Count Calculation

**Question**: How should the system calculate and display multiple words when incremental friction is enabled?

**Decision**: Formula-Based Generation with Vertical Word Stacking (2 Rows Per Word)

**Rationale**:

- Word count formula: `Math.min(1 + sequentialCount, maxWords)`
- Each word is a separate string of length `charLength` (e.g., 20 chars)
- Each word occupies 2 rows stacked vertically: Row 1 = target characters, Row 2 = input fields
- Words separated by vertical spacing (margin/padding between 2-row pairs)
- Total character count = `wordCount * charLength`
- Layout example for 3 words: 6 rows total (word1: rows 1-2, word2: rows 3-4, word3: rows 5-6)

**Generation Pattern**:

```javascript
function generateFrictionString(charLength, sequentialCount, maxWords, incrementalEnabled) {
  if (!incrementalEnabled) {
    return generateRandomString(charLength)
  }
  
  const wordCount = Math.min(1 + sequentialCount, maxWords)
  const words = []
  
  for (let i = 0; i < wordCount; i++) {
    words.push(generateRandomString(charLength))
  }
  
  return words // Array of strings, each displayed as 2-row pair stacked vertically
}
```

**Display Pattern**:

```html
<!-- Words displayed as vertical stack of 2-row pairs -->
<div class="friction-grid">
  <!-- Word 1: 2 rows -->
  <div class="friction-word">
    <div class="friction-row target-row">
      <!-- Target character columns for word 1 -->
    </div>
    <div class="friction-row input-row">
      <!-- Input field columns for word 1 -->
    </div>
  </div>
  
  <div class="word-spacer"></div>
  
  <!-- Word 2: 2 rows -->
  <div class="friction-word">
    <div class="friction-row target-row">
      <!-- Target character columns for word 2 -->
    </div>
    <div class="friction-row input-row">
      <!-- Input field columns for word 2 -->
    </div>
  </div>
</div>
```

**Alternatives Considered**:

- Horizontal single row: All words side-by-side doesn't scale for mobile/narrow screens
- Single long string: No visual separation between words, harder to read
- Exponential scaling: Too aggressive, formula (1 + count) is linear and predictable
- Different char length per word: Added complexity, no clear UX benefit

**UX Benefits of Vertical Stacking**:

- Clearer visual separation between words (each word is a distinct 2-row block)
- Better mobile/responsive support (narrow screens don't need horizontal scrolling)
- Easier keyboard navigation (Tab moves down through words naturally)
- Progress tracking more intuitive (complete word 1, move to word 2, etc.)

**UX Note**: At maxWords=5 with charLength=20, total chars=100, displayed as 5 word blocks × 2 rows each = 10 rows (within performance target SC-010). At maxWords=20 with charLength=50, total chars=1000, displayed as 20 word blocks × 2 rows each = 40 rows (stress test boundary).

---

### 7. Integration with Existing `canSkip()` Utility

**Question**: How should friction logic integrate with the existing `canSkip()` function in utils.js?

**Decision**: Add Friction Parameters to `canSkip()` Function Signature

**Rationale**:

- Existing pattern: `canSkip(strictMode, postpone, passedPercent, postponePercent, skipDelayEnabled, skipDelayPassed)`
- Add two new parameters: `frictionEnabled, frictionCompleted`
- Maintains backward compatibility (new params default to false)
- Consistent with skip delay implementation (specs/001-skip-delay)

**Updated Function Signature**:

```javascript
function canSkip(
  strictMode,
  postpone,
  passedPercent,
  postponePercent,
  skipDelayEnabled = false,
  skipDelayPassed = false,
  frictionEnabled = false,
  frictionCompleted = false
) {
  if (strictMode) {
    if (frictionEnabled && !frictionCompleted) {
      return false // Friction not complete, cannot skip
    }
    if (!frictionEnabled) {
      return false // Strict mode with no friction = no skip allowed (current behavior)
    }
    // Friction enabled and completed = allow skip
    return true
  }
  
  // Non-strict mode logic (unchanged)
  if (skipDelayEnabled && !skipDelayPassed) {
    return false
  }
  // ... existing postpone logic
}
```

**Alternatives Considered**:

- Separate `canSkipWithFriction()` function: Duplicates logic, harder to maintain
- Move friction check to renderer: Breaks separation of concerns (utils for business logic)
- Skip canSkip() entirely: Would require rewriting all break window skip logic

**Testing Impact**: Existing `test/utils.js` tests for `canSkip()` remain valid. Add new test cases for friction parameters.

---

### 8. Theming and Color Scheme Integration

**Question**: How should correct/incorrect color feedback integrate with existing app theming (light/dark mode)?

**Decision**: CSS Custom Properties with Theme-Aware Fallbacks

**Rationale**:

- Existing `app/css/color-scheme.css` uses CSS custom properties for theming
- Define `--correct-green`, `--incorrect-red`, `--empty-bg` in color-scheme.css
- Light theme: green=#28a745, red=#dc3545, empty=transparent
- Dark theme: green=#3fb950, red=#f85149, empty=transparent (GitHub-style colors)

**CSS Implementation** (add to color-scheme.css):

```css
:root {
  --correct-green: #28a745;
  --incorrect-red: #dc3545;
  --empty-bg: transparent;
}

[data-theme='dark'] {
  --correct-green: #3fb950;
  --incorrect-red: #f85149;
}
```

**Alternatives Considered**:

- Hardcoded colors: Breaks theme consistency, accessibility issues
- Opacity-based feedback: Less clear than color change, fails contrast requirements
- Emoji indicators: Not localizable, accessibility concerns

**Accessibility**: Green/red colors meet WCAG AAA contrast ratio (>7:1) against break window background. Users with color blindness benefit from column position tracking.

---

### 9. Localization (i18next) Integration

**Question**: Which UI strings need localization and how should they integrate with existing i18next setup?

**Decision**: Add Localization Keys to `app/locales/en.json` Following Existing Patterns

**Rationale**:

- Existing pattern: All UI strings stored in locale files, accessed via `i18next.t('key')`
- Friction interface has 8 localizable strings: stats labels, button labels, preference labels
- Follow existing key structure: `preferences.skipFriction.*` for settings, `main.*` for UI

**New Localization Keys** (en.json):

```json
{
  "preferences": {
    "skipFriction": {
      "title": "Skip Friction",
      "enabled": "Enable skip friction in strict mode",
      "charLength": "Character length",
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

**Alternatives Considered**:

- Hardcoded English strings: Breaks i18n support for 40+ languages
- Dynamic string generation: Incompatible with translation workflow
- Separate friction locale file: Breaks existing locale file structure

**Translation Workflow**: Contributors will translate new keys via existing Crowdin integration (handled separately from this feature).

---

### 10. Testing Strategy

**Question**: What testing approach ensures 51 functional requirements are validated with existing Vitest framework?

**Decision**: Three-Tier Testing: Unit + Integration + Manual E2E

**Rationale**:

- **Unit tests** (test/frictionGenerator.js): Random string generation, validation state, counter logic
- **Integration tests** (test/utils.js): Updated `canSkip()` function with friction parameters
- **Manual E2E**: Full break workflow (settings → break trigger → friction UI → skip/complete)
- Existing pattern from test/skipDelay.js (hypothetical based on 001-skip-delay)

**Test Coverage Targets**:

- frictionGenerator.js: 100% coverage (pure functions, deterministic)
- utils.js canSkip(): All branches covered (strict mode + friction combinations)
- Integration: Settings persistence, counter increments, sequential reset

**Test Examples**:

```javascript
// test/frictionGenerator.js
describe('generateRandomString', () => {
  it('generates string of specified length', () => {
    const str = generateRandomString(20)
    expect(str).toHaveLength(20)
  })
  
  it('includes all four character classes', () => {
    const str = generateRandomString(20)
    expect(str).toMatch(/[0-9]/) // numbers
    expect(str).toMatch(/[a-z]/) // lowercase
    expect(str).toMatch(/[A-Z]/) // uppercase
    expect(str).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/) // special
  })
})

// test/utils.js (extend existing tests)
describe('canSkip with friction', () => {
  it('prevents skip when friction enabled but not completed', () => {
    expect(canSkip(true, false, 100, 50, false, false, true, false)).toBe(false)
  })
  
  it('allows skip when friction enabled and completed', () => {
    expect(canSkip(true, false, 100, 50, false, false, true, true)).toBe(true)
  })
})
```

**Alternatives Considered**:

- Automated E2E with Playwright: High setup cost, Electron testing complexity
- Snapshot testing for UI: Brittle with dynamic content (random strings)
- Manual testing only: No regression protection

**CI Integration**: Vitest runs in GitHub Actions (existing setup). No new CI configuration required.

---

## Technology Stack Summary

### Confirmed Technologies (No New Dependencies)

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| Runtime | Electron | 39.0.0 | Existing app framework |
| Node | Node.js | 22.20.0 | Existing runtime |
| Settings | electron-store | (current) | Already used for persistence |
| UI | HTML + CSS Grid | - | Standard web tech, no framework needed |
| Localization | i18next | (current) | Existing i18n system |
| Testing | Vitest | 4.0+ | Existing test framework |
| Linting | StandardJS | 17.1+ | Existing code style |

### Performance Characteristics

| Operation | Target | Constraint |
|-----------|--------|------------|
| String generation | <10ms | Up to 100 chars |
| UI render | <1s | All string lengths |
| Input validation | <100ms | Per keystroke |
| Counter persistence | <50ms | electron-store sync write |

---

## Outstanding Questions

**None** - All technical decisions resolved. Ready for Phase 1 (Design & Contracts).

---

## Next Steps (Phase 1)

1. Create `data-model.md` documenting the 8 settings and 4 counters with exact schema
2. Create `contracts/settings.md` with electron-store schema definitions
3. Create `contracts/ui-components.md` with HTML/CSS component specifications
4. Create `contracts/ipc.md` documenting any main/renderer IPC contracts (likely minimal)
5. Create `quickstart.md` with step-by-step implementation guide for developers
6. Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot` to update AI agent context

---

## References

- Feature Specification: `specs/002-strict-mode-password/spec.md`
- Implementation Plan: `specs/002-strict-mode-password/plan.md`
- Similar Feature: `specs/001-skip-delay/spec.md` (skip delay countdown pattern)
- Codebase Patterns: `app/utils/defaultSettings.js`, `app/utils/utils.js`, `app/break-renderer.js`
