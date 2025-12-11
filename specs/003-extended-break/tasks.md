# Tasks: Extended Break Triggers

**Input**: Design documents from `/specs/003-extended-break/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contract.md

**Tests**: Tests are included for critical functionality (trigger evaluation, settings persistence, break duration logic)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for extended break triggers

- [X] T001 Add `extendedBreakTriggers: []` to app/utils/defaultSettings.js
- [X] T002 [P] Create app/utils/extendedBreakTriggers.js with CRUD functions (createTrigger, getTriggers, getTriggerById, updateTrigger, deleteTrigger) and validation helpers (validateTimeOfDay, validateBreakCount, validateDuration)
- [X] T003 [P] Add i18n keys to app/locales/en.json for extended break triggers UI

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core CRUD operations and state management that MUST be complete before trigger evaluation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Implement `createTrigger(settings, config)` in app/utils/extendedBreakTriggers.js
- [X] T005 [P] Implement `getTriggers(settings)` in app/utils/extendedBreakTriggers.js
- [X] T006 [P] Implement `getTriggerById(settings, id)` in app/utils/extendedBreakTriggers.js
- [X] T007 [P] Implement `updateTrigger(settings, id, updates)` in app/utils/extendedBreakTriggers.js
- [X] T008 [P] Implement `deleteTrigger(settings, id)` in app/utils/extendedBreakTriggers.js
- [X] T009 Add state tracking properties to BreaksPlanner constructor in app/breaksPlanner.js: `this.lastTriggerEvaluationDate = new Date().toDateString()` and `this.triggeredTodayIds = new Set()`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Time-Based Extended Break (Priority: P1) 🎯 MVP

**Goal**: Users can configure time-of-day triggers that extend the first break after a specified time to a custom duration once per day

**Independent Test**: Configure a time-of-day trigger for current time +2 minutes, wait for break, verify duration is extended, verify subsequent breaks use regular duration

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] Create test/extendedBreakTriggers.js with tests for createTrigger with time-of-day type
- [ ] T011 [P] [US1] Add test case: createTrigger throws error for invalid time format (e.g., '25:00') in test/extendedBreakTriggers.js
- [ ] T012 [P] [US1] Add test case: createTrigger creates valid time-of-day trigger with correct fields in test/extendedBreakTriggers.js
- [ ] T013 [P] [US1] Add test case: updateTrigger modifies trigger duration successfully in test/extendedBreakTriggers.js
- [ ] T014 [P] [US1] Add test case: deleteTrigger removes trigger from settings in test/extendedBreakTriggers.js

### Implementation for User Story 1

- [X] T015 [US1] Implement `_resetDailyStateIfNeeded()` private method in app/breaksPlanner.js to check date change and clear `triggeredTodayIds`
- [X] T016 [US1] Implement `_evaluateTimeOfDayTrigger(trigger)` private method in app/breaksPlanner.js to match current time and check `triggeredTodayIds`
- [X] T017 [US1] Implement `_evaluateSingleTrigger(trigger)` private method in app/breaksPlanner.js that delegates to `_evaluateTimeOfDayTrigger` based on trigger type
- [X] T018 [US1] Implement `_evaluateExtendedBreakTriggers()` private method in app/breaksPlanner.js that iterates enabled triggers and returns max duration
- [X] T019 [US1] Implement `_getBreakDuration()` private method in app/breaksPlanner.js that checks `_scheduledBreakType === 'break'` and calls `_evaluateExtendedBreakTriggers()`
- [X] T020 [US1] Modify `this.on('breakStarted')` event handler in app/breaksPlanner.js to use `this._getBreakDuration()` instead of `this.settings.get('breakDuration')`
- [X] T021 [US1] Add electron-log statements in `_evaluateTimeOfDayTrigger` to log trigger activation with time and duration

### Integration Tests for User Story 1

- [ ] T022 [US1] Create test/breaksPlanner.js with mock settings containing time-of-day trigger for current time
- [ ] T023 [US1] Add test case: _getBreakDuration returns extended duration when time matches trigger in test/breaksPlanner.js
- [ ] T024 [US1] Add test case: _getBreakDuration returns base duration for second break same day in test/breaksPlanner.js
- [ ] T025 [US1] Add test case: _getBreakDuration returns base duration when_scheduledBreakType is 'microbreak' in test/breaksPlanner.js

**Checkpoint**: At this point, time-of-day triggers should be fully functional - users can configure them via settings file and breaks extend correctly

---

## Phase 4: User Story 2 - Consecutive Break Count Trigger (Priority: P2)

**Goal**: Users can configure count-based triggers that extend every Nth consecutive long break to a custom duration

**Independent Test**: Configure a break-count trigger for every 2nd break, take 2 consecutive long breaks, verify 2nd break is extended, verify 3rd break is regular

### Tests for User Story 2

- [ ] T026 [P] [US2] Add test case: createTrigger with break-count type creates valid trigger in test/extendedBreakTriggers.js
- [ ] T027 [P] [US2] Add test case: createTrigger throws error when breakCount < 2 in test/extendedBreakTriggers.js
- [ ] T028 [P] [US2] Add test case: createTrigger throws error when breakCount is not integer in test/extendedBreakTriggers.js

### Implementation for User Story 2

- [X] T029 [US2] Implement `_evaluateBreakCountTrigger(trigger)` private method in app/breaksPlanner.js to calculate consecutive long breaks and match against breakCount
- [X] T030 [US2] Modify `_evaluateSingleTrigger(trigger)` in app/breaksPlanner.js to delegate to `_evaluateBreakCountTrigger` when type is 'break-count'
- [X] T031 [US2] Add electron-log statement in `_evaluateBreakCountTrigger` to log trigger activation with count and duration

### Integration Tests for User Story 2

- [ ] T032 [US2] Add test case: _getBreakDuration returns extended duration on Nth consecutive break in test/breaksPlanner.js
- [ ] T033 [US2] Add test case: consecutive counter resets after `clear()` is called (idle detection simulation) in test/breaksPlanner.js
- [ ] T034 [US2] Add test case: skipped breaks don't increment counter but still trigger on Nth attempt in test/breaksPlanner.js

### Multiple Trigger Conflict Tests

- [ ] T035 [US2] Add test case: when time-of-day (10min) and break-count (15min) both match, longest duration (15min) wins in test/breaksPlanner.js
- [ ] T036 [US2] Add test case: when multiple time-of-day triggers match, longest duration wins in test/breaksPlanner.js

**Checkpoint**: At this point, both time-of-day and break-count triggers work independently and together (longest wins)

---

## Phase 5: User Story 3 - Configuration Management (Priority: P3)

**Goal**: Users can add, edit, enable/disable, and delete triggers through preferences UI with all settings persisting across restarts

**Independent Test**: Open preferences, add a time-of-day trigger, restart app, verify trigger persists and is shown in UI, disable trigger, verify break uses regular duration

### IPC Handlers Implementation

- [X] T037 [P] [US3] Add `ipcMain.handle('get-extended-break-triggers')` in app/main.js that calls `getTriggers(settings)` and returns `{ success, data }`
- [X] T038 [P] [US3] Add `ipcMain.handle('create-extended-break-trigger')` in app/main.js with try/catch calling `createTrigger(settings, config)`
- [X] T039 [P] [US3] Add `ipcMain.handle('update-extended-break-trigger')` in app/main.js with try/catch calling `updateTrigger(settings, id, updates)`
- [X] T040 [P] [US3] Add `ipcMain.handle('delete-extended-break-trigger')` in app/main.js with try/catch calling `deleteTrigger(settings, id)`

### UI Implementation

- [X] T041 [US3] Add extended break triggers section to app/preferences.html with table structure (thead with columns: Enabled, Type, Condition, Duration, Actions)
- [X] T042 [US3] Add CSS styles for trigger table in app/css/preferences.css (table layout, button styles, checkbox styles)
- [X] T043 [US3] Implement `loadExtendedBreakTriggers()` async function in app/preferences-renderer.js that calls `ipcRenderer.invoke('get-extended-break-triggers')`
- [X] T044 [US3] Implement `renderTriggerTable(triggers)` function in app/preferences-renderer.js that populates table with trigger rows
- [X] T045 [US3] Add event listener for "Add Trigger" button in app/preferences-renderer.js that shows input prompts for type, condition, duration (follow existing pattern: use simple HTML form within preferences window, similar to break idea management)
- [X] T046 [US3] Implement `createNewTrigger(config)` async function in app/preferences-renderer.js that calls `ipcRenderer.invoke('create-extended-break-trigger')`
- [X] T047 [US3] Implement `updateTriggerEnabled(id, enabled)` async function in app/preferences-renderer.js for checkbox changes
- [X] T048 [US3] Implement `editTrigger(trigger)` function in app/preferences-renderer.js with prompt for duration modification
- [X] T049 [US3] Implement `deleteTriggerById(id)` async function in app/preferences-renderer.js with confirmation dialog
- [X] T050 [US3] Call `loadExtendedBreakTriggers()` on DOMContentLoaded in app/preferences-renderer.js

### Localization

- [X] T051 [P] [US3] Add i18n keys for trigger UI to app/locales/en.json: extendedBreakTriggers, extendedBreakTriggersDescription, triggerEnabled, triggerType, triggerCondition, triggerDuration, actions, addTrigger, noTriggersConfigured
- [X] T052 [P] [US3] Copy i18n keys from en.json to other locale files (de.json, es.json, fr.json, etc.) with placeholders for translation

**Checkpoint**: Full CRUD UI is functional - users can manage triggers without editing config files

**Acceptance Criteria for UI Completion:**

- All trigger CRUD operations work through preferences UI (create, read, update, delete)
- Settings persist across app restart
- No console errors during trigger operations
- UI updates immediately after trigger changes
- Validation errors shown to user with clear messages

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [ ] T053 [P] Run `npm run lint` and fix all StandardJS violations in new/modified files
- [ ] T054 [P] Run `npm test` and verify all tests pass
- [ ] T055 Verify manual test checklist from quickstart.md Step 10 (14 test scenarios)
- [ ] T056 [P] Add JSDoc comments to public functions in app/utils/extendedBreakTriggers.js
- [ ] T057 Test idle detection cancels extended break correctly (start 15min break, idle for 5min, verify break cancels)
- [ ] T058 Test midnight reset works correctly (configure time-of-day trigger, verify it triggers, wait until next day, verify it triggers again)
- [ ] T059 Test multiple triggers with longest-wins logic (configure 10min and 20min triggers both active, verify 20min used)
- [ ] T060 [P] Update CHANGELOG.md with feature description for next release
- [ ] T061 Verify triggers persist across app restart (create trigger, restart app, verify trigger still exists)
- [ ] T062 Test disabled trigger doesn't fire (create trigger, disable it, verify break uses regular duration)
- [ ] T063 [P] Add error recovery in getTriggers() function in app/utils/extendedBreakTriggers.js with try/catch for corrupt data, log error with electron-log, return empty array on failure (implements FR-022)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T003) completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (T004-T009) completion
- **User Story 2 (Phase 4)**: Depends on Foundational (T004-T009) completion - Can run parallel with US1 if desired, but recommended AFTER US1 for MVP
- **User Story 3 (Phase 5)**: Depends on US1 and US2 trigger evaluation logic being complete (T015-T031)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - MVP)**: Can start after Foundational (Phase 2) - No dependencies on other stories
  - Delivers: Time-of-day triggers working end-to-end
  - Testable: Configure via settings file, verify breaks extend correctly
  
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Extends US1 evaluation logic
  - Delivers: Break-count triggers working end-to-end
  - Testable: Configure via settings file, verify every Nth break extends
  - Note: Shares `_evaluateExtendedBreakTriggers()` with US1
  
- **User Story 3 (P3)**: Depends on US1 + US2 trigger types being implemented
  - Delivers: UI for creating/editing/deleting triggers
  - Testable: Full CRUD operations through preferences window
  - Blocks: User adoption (requires UI for non-technical users)

### Within Each User Story

- **US1**: Tests (T010-T014) → Implementation (T015-T021) → Integration Tests (T022-T025)
- **US2**: Tests (T026-T028) → Implementation (T029-T031) → Integration Tests (T032-T036)
- **US3**: IPC Handlers (T037-T040) in parallel → UI (T041-T050) sequential → Localization (T051-T052) in parallel

### Parallel Opportunities

**Setup Phase (Phase 1)**:

- T002 (create extendedBreakTriggers.js) and T003 (add i18n keys) can run in parallel with T001

**Foundational Phase (Phase 2)**:

- T005-T008 (getTriggers, getTriggerById, updateTrigger, deleteTrigger) can run in parallel after T004 completes

**User Story 1 Tests**:

- T010, T011, T012, T013, T014 can all run in parallel (different test cases in same file)

**User Story 2 Tests**:

- T026, T027, T028 can run in parallel

**User Story 3 IPC Handlers**:

- T037, T038, T039, T040 can all run in parallel (different IPC channels)

**User Story 3 Localization**:

- T051 and T052 can run in parallel

**Polish Phase**:

- T053 (lint), T054 (tests), T056 (JSDoc), T060 (CHANGELOG) can run in parallel

**Cross-Story Parallelization**:

- If team capacity allows, User Story 2 can be implemented in parallel with User Story 1 (both depend only on Foundational phase)
- User Story 3 UI work (T041-T050) can start once US1 is complete, even if US2 is still in progress

---

## Parallel Example: User Story 1 Implementation

```bash
# After Foundational phase (T001-T009) completes:

# Write all tests in parallel
git checkout -b feature/us1-tests
task T010 & task T011 & task T012 & task T013 & task T014
# All tests should FAIL (red) - this is expected

# Implement core evaluation logic sequentially (dependencies)
git checkout -b feature/us1-implementation
task T015  # _resetDailyStateIfNeeded (no dependencies)
task T016  # _evaluateTimeOfDayTrigger (depends on T015)
task T017  # _evaluateSingleTrigger (depends on T016)
task T018  # _evaluateExtendedBreakTriggers (depends on T017)
task T019  # _getBreakDuration (depends on T018)
task T020  # Modify breakStarted handler (depends on T019)
task T021  # Add logging (can run anytime after T016)

# Run unit tests - should now PASS (green)
npm test test/extendedBreakTriggers.js

# Run integration tests
task T022 & task T023 & task T024 & task T025
npm test test/breaksPlanner.js

# All green? User Story 1 is complete and ready for manual testing
```

---

## Parallel Example: User Story 3 (After US1 + US2 Complete)

```bash
# IPC handlers can all run in parallel
git checkout -b feature/us3-ipc
task T037 & task T038 & task T039 & task T040

# UI implementation must be sequential (DOM dependencies)
git checkout -b feature/us3-ui
task T041  # Add HTML structure
task T042  # Add CSS styles
task T043  # loadExtendedBreakTriggers function
task T044  # renderTriggerTable function
task T045  # Add trigger button listener
task T046  # createNewTrigger function
task T047  # updateTriggerEnabled function
task T048  # editTrigger function
task T049  # deleteTriggerById function
task T050  # DOMContentLoaded call

# Localization can run in parallel
git checkout -b feature/us3-i18n
task T051 & task T052

# Merge all branches
git checkout 003-extended-break
git merge feature/us3-ipc
git merge feature/us3-ui
git merge feature/us3-i18n
```

---

## MVP Delivery Strategy

**Recommended approach**: Implement User Story 1 first as standalone MVP

### MVP: User Story 1 Only (Time-Based Triggers)

**Tasks**: T001-T025 (25 tasks, ~4-6 hours)

**Delivers**:

- Users can add time-of-day triggers to settings file
- Breaks extend correctly when time matches
- Triggers reset daily at midnight
- Longest duration wins when multiple triggers match
- Full test coverage for time-based logic

**Value**: Users can enforce daily lunch breaks or exercise periods without UI (power users can edit config.json directly)

**Limitations**:

- No break-count triggers yet
- No UI for configuration (manual config.json editing)

**Next Increment**: Add User Story 2 (T026-T036) for break-count triggers

**Final Increment**: Add User Story 3 (T037-T052) for UI configuration

---

## Estimated Effort

### Time Estimates (Single Developer)

- **Phase 1 (Setup)**: 0.5 hours (3 simple tasks)
- **Phase 2 (Foundational)**: 2 hours (CRUD operations + validation)
- **Phase 3 (User Story 1)**: 4 hours (evaluation logic + tests)
- **Phase 4 (User Story 2)**: 2 hours (break-count logic + tests)
- **Phase 5 (User Story 3)**: 4 hours (IPC + UI + i18n)
- **Phase 6 (Polish)**: 2 hours (testing + validation + docs)

**Total**: ~14-15 hours for complete implementation

**MVP (US1 only)**: ~7 hours (Phases 1-3 + error recovery from Phase 6)

### Task Count by Phase

- Setup: 3 tasks
- Foundational: 6 tasks
- User Story 1: 16 tasks (5 tests, 7 implementation, 4 integration tests)
- User Story 2: 11 tasks (3 tests, 3 implementation, 5 integration tests)
- User Story 3: 16 tasks (4 IPC, 10 UI, 2 i18n)
- Polish: 11 tasks (includes error recovery T063)

**Total**: 63 tasks

**Parallel Opportunities**: ~21 tasks can run in parallel (marked with [P])

---

## Notes

- All tasks follow StandardJS code style (no semicolons, 2-space indent, single quotes)
- All imports use ES Modules with explicit `.js` extensions
- All new code follows existing Stretchly patterns (EventEmitter, electron-store, electron-log)
- Tests use Vitest + chai (existing test framework)
- All file paths are absolute from repository root
- User Story 1 (time-of-day triggers) is the recommended MVP - fully functional without US2 or US3
- User Story 2 (break-count triggers) extends US1 with minimal additional code
- User Story 3 (UI) makes the feature accessible to non-technical users but isn't required for core functionality
