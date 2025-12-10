# Tasks: Strict Mode Skip Friction

**Feature Branch**: `002-strict-mode-password`  
**Input**: Design documents from `specs/002-strict-mode-password/`  
**Generated**: December 10, 2025

---

## Task Format

All tasks follow this format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Task can run in parallel (different files, no blocking dependencies)
- **[Story]**: User story label (US1, US2, US3, US4) - only for user story phase tasks
- **File paths**: All paths are relative to repository root

---

## Phase 1: Setup & Foundation

**Purpose**: Project initialization and settings infrastructure

**Dependencies**: None - can start immediately

### Settings Foundation

- [X] T001 [P] Add 12 new friction settings to `app/utils/defaultSettings.js` (microbreakSkipFrictionEnabled, microbreakSkipFrictionCharLength, microbreakSkipFrictionIncrementalEnabled, microbreakSkipFrictionMaxWords, microbreakSkipFrictionTotalCount, microbreakSkipFrictionSequentialCount, plus 6 matching breakSkipFriction* settings)
- [X] T002 [P] Add friction UI i18n keys to `app/locales/en.json` (preferences.skipFriction.*, main.friction*)
- [ ] T003 Verify settings persist correctly by running `npm start`, opening DevTools in preferences window, and checking `await window.settings.get('microbreakSkipFrictionEnabled')` returns `true`

---

## Phase 2: Random String Generation Utility

**Purpose**: Create reusable friction string generator module

**Dependencies**: Phase 1 complete (settings available)

### Core Generation Logic

- [X] T004 Create `app/utils/frictionGenerator.js` with ES Module exports for generateRandomString() and generateFrictionStrings()
- [X] T005 Implement Fisher-Yates shuffle algorithm in frictionGenerator.js using character classes (NUMBERS='0123456789', LOWERCASE='a-z', UPPERCASE='A-Z', SPECIAL='!@#$%^&*()_+-=[]{}|;:,.<>?')
- [X] T006 Implement balanced character distribution logic ensuring charsPerClass = Math.floor(length/4) with remainder handling
- [X] T007 Implement generateFrictionStrings() function supporting incremental friction with word count formula: min(1 + sequentialCount, maxWords)

### Testing

- [X] T008 Create `test/frictionGenerator.js` with Vitest tests for correct length, character class distribution, uniqueness across calls, incremental word count, and edge cases (length=1, length=50, maxWords boundary)
- [X] T009 Run `npm test test/frictionGenerator.js` and verify all tests pass with 100% coverage for frictionGenerator.js

---

## Phase 3: User Story 1 - Configure Skip Friction Settings (Priority P1) 🎯

**Goal**: Users can configure friction settings in preferences (enabled state, character length, incremental friction, max words) for both mini and long breaks

**Independent Test**: Navigate to preferences, locate skip friction settings under strict mode section, adjust character length from 20 to 10, enable/disable incremental friction, save preferences, restart app, verify settings persisted

**Why First**: Core configuration needed for feature to exist - all other user stories depend on these settings being configurable

### Preferences UI Implementation

- [X] T010 [US1] Add friction settings section HTML to `app/preferences.html` under strict mode settings for mini breaks (checkbox for enabled, number input for charLength with min=1 max=50, checkbox for incrementalEnabled, number input for maxWords with min=1 max=20)
- [X] T011 [P] [US1] Add friction settings section HTML to `app/preferences.html` under strict mode settings for long breaks (same structure as mini breaks)
- [X] T012 [US1] Add CSS styles to `app/css/preferences.css` for .friction-settings-section class with consistent spacing and layout matching existing strict mode UI
- [X] T013 [US1] Implement loadFrictionSettings() function in `app/preferences-renderer.js` to populate UI from electron-store using window.settings.get() for all 12 friction settings
- [X] T014 [US1] Implement saveFrictionSettings() function in `app/preferences-renderer.js` to persist user changes using window.settings.set() with validation (charLength 1-50, maxWords 1-20, enforce limits)
- [X] T015 [US1] Add event listeners in `app/preferences-renderer.js` for friction setting controls calling saveFrictionSettings() on change events
- [X] T016 [US1] Add input validation in `app/preferences-renderer.js` preventing invalid values (negative numbers, zero, exceeding max) with user-visible error messages

### Integration Tests

- [X] T017 [US1] Create `test/frictionSettings.js` with integration tests for settings load/save cycle, validation rules, and persistence across mock app restarts
- [ ] T018 [US1] Run manual E2E test: open preferences, change all 8 config settings (4 per break type), save, restart app, verify all changes persisted

**Checkpoint US1**: User Story 1 complete - users can now configure all friction settings through preferences UI

---

## Phase 4: User Story 2 - Skip Break with Character-by-Character Typing (Priority P2) 🎯

**Goal**: Users can skip strict mode breaks by typing randomly-generated complex strings with real-time visual feedback, with incremental friction increasing word count based on sequential skips

**Independent Test**: Enable strict mode with friction, wait for break to trigger, attempt skip, view randomly-generated string with multi-word display if incremental friction active, type characters observing green/red color feedback, verify skip button appears only when all correct

**Why Second**: Delivers core user value of friction mechanism - depends on P1 for configuration being available

### Friction UI Components (Break Windows)

- [X] T019 [P] [US2] Add friction interface HTML structure to `app/break.html` (friction-container div with friction-stats, friction-grid, friction-actions sections, hidden by default with style="display: none")
- [X] T020 [P] [US2] Add friction interface HTML structure to `app/microbreak.html` (identical structure to break.html)
- [X] T021 [US2] Add friction interface CSS to `app/css/break.css` including .friction-container, .friction-grid, .friction-word (flex-direction: column), .friction-row (display: grid), .friction-column states (empty/correct/incorrect), theme colors (--correct-green, --incorrect-red)
- [X] T022 [US2] Add responsive CSS media queries to `app/css/break.css` for tablet (@media max-width: 768px) and mobile (@media max-width: 480px) with adjusted font sizes and grid layouts

### Dynamic UI Generation (Break Renderer)

- [X] T023 [US2] Implement generateFrictionUI() function in `app/break-renderer.js` creating DOM elements for multi-word layout (each word = 2 rows vertically stacked: targetRow with target-char divs + inputRow with input-char inputs)
- [X] T024 [P] [US2] Implement generateFrictionUI() function in `app/microbreak-renderer.js` (identical to break-renderer.js implementation)
- [X] T025 [US2] Implement setupFrictionValidation() function in `app/break-renderer.js` with input event listeners, character-by-character validation, column state updates (empty/correct/incorrect classes), and skip button visibility toggle
- [X] T026 [P] [US2] Implement setupFrictionValidation() function in `app/microbreak-renderer.js` (identical to break-renderer.js implementation)
- [X] T027 [US2] Implement auto-focus behavior in break-renderer.js moving to next input on correct entry, and backspace navigation to previous input on empty field
- [X] T028 [P] [US2] Implement auto-focus behavior in microbreak-renderer.js (identical to break-renderer.js implementation)

### Skip Attempt Workflow

- [X] T029 [US2] Modify handleSkipAttempt() function in `app/break-renderer.js` to check strictMode && frictionEnabled, hide default skip button, show friction interface, call generateTargetStrings() using frictionGenerator.js
- [X] T030 [P] [US2] Modify handleSkipAttempt() function in `app/microbreak-renderer.js` (identical logic to break-renderer.js but using microbreak settings)
- [X] T031 [US2] Implement generateTargetStrings() helper in `app/break-renderer.js` calling frictionGenerator.generateFrictionStrings() with settings from electron-store (charLength, sequentialCount, maxWords, incrementalEnabled)
- [X] T032 [P] [US2] Implement generateTargetStrings() helper in `app/microbreak-renderer.js` (identical to break-renderer.js but using microbreakSkipFriction* settings)

### Counter Management

- [X] T033 [US2] Implement incrementFrictionCounters() function in `app/main.js` using IPC handler for 'increment-friction-counters' event, incrementing both totalCount and sequentialCount for specified break type ('microbreak' or 'break')
- [X] T034 [US2] Implement resetSequentialCounter() function in `app/main.js` using IPC handler for 'reset-sequential-counter' event, setting sequentialCount to 0 for specified break type when break completes without skip
- [X] T035 [US2] Add IPC send call in `app/break-renderer.js` setupFrictionActions() skip handler calling window.ipc.send('increment-friction-counters', 'break') before skipBreak()
- [X] T036 [P] [US2] Add IPC send call in `app/microbreak-renderer.js` setupFrictionActions() skip handler calling window.ipc.send('increment-friction-counters', 'microbreak') before skipBreak()
- [X] T037 [US2] Add IPC send call in `app/break-renderer.js` break completion handler calling window.ipc.send('reset-sequential-counter', 'break') when break completes normally
- [X] T038 [P] [US2] Add IPC send call in `app/microbreak-renderer.js` break completion handler calling window.ipc.send('reset-sequential-counter', 'microbreak') when break completes normally

### Statistics Display

- [X] T039 [US2] Update generateFrictionUI() in `app/break-renderer.js` to populate friction-total-count and friction-sequential-count span elements with current counter values from electron-store
- [X] T040 [P] [US2] Update generateFrictionUI() in `app/microbreak-renderer.js` to populate statistics (identical to break-renderer.js but using microbreak counters)

### CanSkip Integration

- [X] T041 [US2] Update canSkip() function in `app/utils/utils.js` to return friction parameters object { frictionEnabled, charLength, sequentialCount, maxWords, incrementalEnabled } when strict mode active
- [X] T042 [US2] Update all canSkip() call sites in break-renderer.js and microbreak-renderer.js to handle new friction parameters object

### Testing

- [X] T043 [US2] Create `test/frictionUI.js` with Vitest tests for generateFrictionUI() rendering correct DOM structure, setupFrictionValidation() state transitions, and multi-word layout with vertical 2-row pairs
- [X] T044 [US2] Create `test/frictionCounters.js` with tests for incrementFrictionCounters() and resetSequentialCounter() logic, separate tracking for mini/long breaks, and persistence
- [X] T045 [US2] Update `test/utils.js` adding tests for canSkip() returning friction parameters when strict mode + friction enabled
- [X] T046 [US2] Run `npm test` and verify all tests pass including new friction UI and counter tests
- [ ] T047 [US2] Run manual E2E test: trigger break with incremental friction, skip 3 times observing word count increase (1, 2, 3 words), verify each word displays as 2 rows vertically stacked, complete one break without skip, verify next skip shows 1 word (sequential counter reset)

**Checkpoint US2**: User Story 2 complete - users can now skip breaks using friction interface with real-time feedback and incremental difficulty

---

## Phase 5: User Story 3 - View and Reset Skip Counter (Priority P3)

**Goal**: Users can view total skip counts in preferences and reset counters to zero when desired

**Independent Test**: View preferences showing skip counter initially at 0, skip a strict mode break using friction, reopen preferences verifying counter incremented to 1, click reset button, verify counter returns to 0, restart app, verify counter still at 0

**Why Third**: Provides useful feedback mechanism but not critical for core friction functionality - users can benefit without tracking

### Counter Display in Preferences

- [X] T048 [P] [US3] Add total counter display HTML to `app/preferences.html` in mini break friction section (read-only text showing microbreakSkipFrictionTotalCount value)
- [X] T049 [P] [US3] Add total counter display HTML to `app/preferences.html` in long break friction section (read-only text showing breakSkipFrictionTotalCount value)
- [X] T050 [P] [US3] Add reset button HTML to `app/preferences.html` for mini break counter with data-i18next="preferences.skipFriction.resetCount"
- [X] T051 [P] [US3] Add reset button HTML to `app/preferences.html` for long break counter with data-i18next="preferences.skipFriction.resetCount"

### Counter Reset Logic

- [X] T052 [US3] Implement resetTotalCounter() function in `app/preferences-renderer.js` calling window.settings.set() to set totalCount to 0 for specified break type
- [X] T053 [US3] Add event listeners in `app/preferences-renderer.js` for reset buttons calling resetTotalCounter('microbreak') or resetTotalCounter('break')
- [X] T054 [US3] Update loadFrictionSettings() in `app/preferences-renderer.js` to display current totalCount values on preferences load

### Testing

- [ ] T055 [US3] Update `test/frictionSettings.js` with tests for counter display and reset functionality
- [ ] T056 [US3] Run manual E2E test: open preferences (counter shows 0), close preferences, skip break using friction, reopen preferences (counter shows 1), click reset (counter shows 0), restart app, verify counter still shows 0

**Checkpoint US3**: User Story 3 complete - users can now view and reset skip counters in preferences

---

## Phase 6: User Story 4 - View Skip Statistics During Friction (Priority P3)

**Goal**: Friction interface displays both total skip count and sequential skip count providing transparency about skip behavior

**Independent Test**: Enable friction with incremental friction, skip breaks multiple times, verify friction interface displays correct total and sequential counts, verify counts are separate for mini and long breaks

**Why Fourth**: Enhances transparency but not critical - users can skip without seeing statistics
zR*dw
### Statistics Integration (Already Implemented in US2)

**Note**: This user story was already implemented as part of Phase 4 (US2) tasks T039 and T040 which populate the statistics display during friction UI generation. No additional tasks required.

- [ ] T057 [US4] Run manual E2E test: skip 5 mini breaks (verify stats show "Total: 5, Sequential: 5"), complete 1 mini break (verify next skip shows "Total: 6, Sequential: 1"), trigger long break and skip (verify shows independent long break statistics)

**Checkpoint US4**: User Story 4 complete - statistics display was already implemented in US2

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements, edge case handling, and code quality improvements

### Edge Case Handling

- [ ] T058 [P] Add visual distinction for similar characters (0/O, 1/l/I) in `app/css/break.css` using monospace font 'Courier New' with increased font-weight
- [ ] T059 [P] Add paste event handling in `app/break-renderer.js` and `app/microbreak-renderer.js` allowing paste functionality (friction comes from complexity, not preventing paste)
- [ ] T060 [P] Add theme change listener in `app/break-renderer.js` and `app/microbreak-renderer.js` updating friction interface colors when theme changes during active friction display
- [ ] T061 Add counter overflow protection in `app/main.js` incrementFrictionCounters() capping totalCount and sequentialCount at Number.MAX_SAFE_INTEGER

### Accessibility

- [ ] T062 [P] Add ARIA labels to friction interface in generateFrictionUI() (`role="region"`, `aria-label="Skip friction interface"`, `aria-live="polite"` for stats)
- [ ] T063 [P] Add keyboard navigation support with Tab (next input), Shift+Tab (previous), Enter (submit when all correct), Escape (cancel friction)
- [ ] T064 Verify screen reader compatibility using NVDA/VoiceOver reading statistics and input fields correctly

### Code Quality

- [ ] T065 Run `npm run lint` and fix all StandardJS violations (no semicolons, 2-space indent, single quotes, ES6+)
- [ ] T066 Add JSDoc comments to all exported functions in `app/utils/frictionGenerator.js`, `app/break-renderer.js`, `app/microbreak-renderer.js`
- [ ] T067 Run `npm run coverage` and verify friction feature code has >80% test coverage

### Documentation

- [ ] T068 Update `CHANGELOG.md` with feature description under "Added" section for next release
- [ ] T069 [P] Update `README.md` mentioning skip friction in strict mode features section
- [ ] T070 [P] Add friction feature documentation to user guide (if exists) with screenshots showing multi-word vertical layout

---

## Dependencies & Execution Order

### Critical Path (Must Execute Sequentially)

```
Phase 1 (Setup) 
  ↓
Phase 2 (String Generator)
  ↓
Phase 3 (US1: Configuration UI)
  ↓
Phase 4 (US2: Friction Interface & Counters)
  ↓
Phase 5 (US3: Counter Display/Reset)
  ↓
Phase 6 (US4: Statistics - already in US2)
  ↓
Phase 7 (Polish)
```

### Parallel Execution Opportunities

**Within Phase 1**:
- T001, T002 (different files)

**Within Phase 3**:
- T010, T011 (mini vs long break sections - different HTML regions)

**Within Phase 4**:
- T019, T020 (break.html vs microbreak.html)
- T023, T024 (break-renderer.js vs microbreak-renderer.js)
- T025, T026 (different renderer files)
- T027, T028 (different renderer files)
- T029, T030 (different renderer files)
- T031, T032 (different renderer files)
- T035, T036 (different renderer files)
- T037, T038 (different renderer files)
- T039, T040 (different renderer files)

**Within Phase 5**:
- T048, T049, T050, T051 (different HTML sections)

**Within Phase 7**:
- T058, T059, T060 (different concerns)
- T062, T063 (different accessibility features)
- T069, T070 (different documentation files)

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**Recommended First Delivery**: User Story 1 only (Phase 1 + Phase 2 + Phase 3)

Delivers configuration UI allowing users to:
- Enable/disable friction
- Set character length
- Configure incremental friction
- View/reset counters

**Why Stop Here for MVP**:
- Complete user-facing feature (settings)
- Independently testable
- Provides foundation for US2
- Can merge to trunk and release
- Users can prepare settings before friction UI implementation

### Full Feature Delivery

**Second Delivery**: User Stories 2, 3, 4 (Phase 4 + Phase 5 + Phase 6)

Delivers complete friction mechanism with:
- Character-by-character typing interface
- Real-time color feedback
- Incremental difficulty
- Statistics display
- Counter management

**Final Delivery**: Polish (Phase 7)

Adds production-ready quality:
- Edge case handling
- Accessibility compliance
- Documentation
- Code quality verification

---

## Summary

- **Total Tasks**: 70 tasks across 7 phases
- **Parallel Tasks**: 28 tasks marked with [P] can run in parallel
- **User Stories**: 4 stories (US1=18 tasks, US2=29 tasks, US3=9 tasks, US4=1 task, Setup=6 tasks, Polish=13 tasks)
- **Estimated Time**: 8-12 hours for full implementation
- **Critical Files**: 
  - Settings: `app/utils/defaultSettings.js`
  - Generator: `app/utils/frictionGenerator.js` (NEW)
  - Break UIs: `app/break-renderer.js`, `app/microbreak-renderer.js`
  - Preferences: `app/preferences-renderer.js`, `app/preferences.html`
  - Styles: `app/css/break.css`, `app/css/preferences.css`
  - Tests: `test/frictionGenerator.js` (NEW), `test/frictionSettings.js` (NEW), `test/frictionUI.js` (NEW), `test/frictionCounters.js` (NEW)
- **Test Coverage Target**: >80% for all new friction-related code
- **Code Style**: StandardJS (no semicolons, 2-space indent, ES6+, ES Modules with .js extensions)
