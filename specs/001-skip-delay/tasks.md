# Tasks: Configurable Skip Delay

**Feature**: 001-skip-delay  
**Input**: Design documents from `specs/001-skip-delay/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks grouped by user story for independent implementation and testing

**Tests**: Not explicitly requested in spec - focusing on implementation tasks only

## Phase 1: Setup (Project Initialization)

**Purpose**: Prepare development environment and verify tooling

- [X] T001 Verify Node.js 22.20.0+ installed and feature branch 001-skip-delay is active
- [X] T002 [P] Run npm run lint to confirm StandardJS configuration working
- [X] T003 [P] Run npm test to verify existing tests pass before modifications

**Time Estimate**: ~5 minutes

---

## Phase 2: Foundational (Blocking Prerequisites for All User Stories)

**Purpose**: Core infrastructure MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: User stories cannot be implemented until these tasks complete

- [X] T004 Add skipDelayEnabled (default: false) and skipDelayDuration (default: 30000) to app/utils/defaultSettings.js
- [X] T005 Update canSkip() function signature in app/utils/utils.js to accept skipDelayEnabled and skipDelayPassed parameters
- [X] T006 [P] Add skip delay i18n strings to app/locales/en.json (skipDelay, skipDelayInfo, enableSkipDelay, skipDelayDuration)

**Checkpoint**: Foundation ready - settings exist, core logic updated, strings available

**Time Estimate**: ~15 minutes

---

## Phase 3: User Story 1 - Default Skip Delay Behavior (Priority: P1) 🎯 MVP

**Goal**: When skip delay is enabled, enforce minimum viewing time with MANDATORY visual countdown before skip button becomes available

**Independent Test**: Enable skip delay in settings (manually edit electron-store or add temp UI), trigger break, verify skip button disabled for 30 seconds with countdown, then becomes enabled

**Why MVP**: Core value proposition - prevents impulsive skipping, validates feature usefulness

### Implementation for User Story 1

- [X] T007 [P] [US1] Add `<span id='skip-countdown' class='hidden' aria-hidden="true"></span>` after progress-time in app/break.html
- [X] T008 [P] [US1] Add `<span id='skip-countdown' class='hidden' aria-hidden="true"></span>` after progress-time in app/microbreak.html
- [X] T009 [US1] In app/break-renderer.js: Read skipDelayEnabled and skipDelayDuration settings at initialization (after locale variable)
- [X] T010 [US1] In app/break-renderer.js: Get skipCountdownElement reference with other element refs
- [X] T011 [US1] In app/break-renderer.js: Calculate skipDelayPassed in setInterval, update canSkip() call with new params, add countdown display logic
- [X] T012 [US1] In app/microbreak-renderer.js: Duplicate changes from T009-T011 (read settings, get element, update interval logic)
- [X] T013 [US1] Manual test: Enable skipDelayEnabled in electron-store, trigger break, verify countdown displays and skip button appears after 30 seconds

**Checkpoint**: User Story 1 complete - skip delay enforced on both break types when feature enabled, countdown visible

**Time Estimate**: ~45 minutes

---

## Phase 4: User Story 2 - Configurable Skip Delay in Preferences (Priority: P2)

**Goal**: Users can enable/disable skip delay and configure duration (1-300 seconds) via Preferences UI

**Independent Test**: Open Preferences > Schedule, toggle skip delay on/off, change duration, verify input enables/disables, trigger break to confirm custom duration enforced

**Why This Order**: Builds on US1 (which works but requires manual config). Adds UI for easy user control.

### Implementation for User Story 2

- [X] T014 [P] [US2] Add skip delay section to app/preferences.html after strict mode section (hr, heading span, info p, checkbox, range input with data-divisor="1000")
- [X] T015 [US2] In app/preferences-renderer.js: Add logic to get skipDelayCheckbox and skipDelayInput elements
- [X] T016 [US2] In app/preferences-renderer.js: Initialize input.disabled based on checkbox.checked state
- [X] T017 [US2] In app/preferences-renderer.js: Add checkbox.onchange handler to toggle input.disabled and save skipDelayEnabled setting
- [X] T018 [US2] Manual test: Open Preferences, toggle checkbox, verify input enables/disables, set duration to 10 seconds, trigger break, verify 10-second countdown
- [X] T019 [US2] Manual test: Attempt to set duration to 0 with feature enabled, verify HTML5 validation prevents invalid input (min="1" attribute)

**Checkpoint**: User Story 2 complete - full UI control for enable/disable and duration configuration

**Time Estimate**: ~35 minutes

---

## Phase 5: User Story 3 - Skip Delay Applies to Both Break Types (Priority: P3)

**Goal**: Ensure skip delay consistently applies to microbreaks AND long breaks with single configuration

**Independent Test**: Configure skip delay, trigger microbreak (verify enforcement), trigger long break (verify enforcement), change setting, verify both break types use new value

**Why This Order**: Validates consistency requirement after both core logic (US1) and configuration UI (US2) are working

### Validation for User Story 3

- [X] T020 [US3] Manual test: Enable skip delay with 15-second duration, trigger microbreak, verify 15-second countdown and skip delay enforcement
- [X] T021 [US3] Manual test: With same 15-second setting active, trigger long break, verify identical 15-second countdown and enforcement
- [X] T022 [US3] Manual test: Change skip delay to 60 seconds in Preferences, trigger microbreak, verify new 60-second countdown
- [X] T023 [US3] Manual test: Without changing settings, trigger long break, verify same 60-second countdown (confirms both types read same setting)

**Checkpoint**: User Story 3 complete - verified single setting controls both break types consistently

**Time Estimate**: ~20 minutes

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Handle edge cases, optional styling, testing infrastructure

- [ ] T024 [P] Optional: Add CSS styling for skip-countdown element in app/css/break.css (subtle, non-intrusive per spec mitigation)
- [ ] T025 [P] Create test/skipDelay.js with 7 test cases for canSkip() logic: (1) skip delay disabled, (2) skip delay enabled but not passed, (3) skip delay enabled and passed, (4) strict mode overrides skip delay, (5) postpone window respects skip delay, (6) resume from suspend recalculates time, (7) skip delay longer than break duration
- [ ] T026 Update existing canSkip() calls in test/utils.js to include two new false parameters (skipDelayEnabled=false, skipDelayPassed=false)
- [ ] T027 Run npm test to verify all tests pass including new skipDelay tests
- [ ] T028 Run npm run lint to verify StandardJS compliance (no semicolons, 2-space indent, single quotes)
- [ ] T029 [P] Manual test: Enable strict mode for microbreaks, enable skip delay, trigger microbreak, verify skip never appears (strict mode takes precedence per FR-016)
- [ ] T030 [P] Manual test: Trigger break with skip delay enabled, suspend system for 35 seconds, resume, verify countdown shows 0 or skip available (wall-clock time handling per FR-015)
- [ ] T031 [P] Manual test: Set skip delay to 300 seconds on 20-second microbreak, verify skip becomes available at break end (FR-017: delay OR break duration, whichever first)
- [ ] T032 [P] Manual test: Disable skip delay feature, trigger break, verify skip immediately available (backward compatibility per FR-014, SC-002)
- [ ] T033 Final verification: Run full test suite (npm test), verify all passing, commit changes

**Checkpoint**: All edge cases handled, tests passing, feature complete

**Time Estimate**: ~45 minutes

---

## Dependencies & Execution Order

### Story Completion Order (Sequential - Each Story Blocks Next)

```
Phase 1 (Setup) 
  ↓
Phase 2 (Foundation) ← MUST COMPLETE FIRST
  ↓
Phase 3 (US1: Default Behavior) ← MVP DELIVERY POINT
  ↓
Phase 4 (US2: Configuration UI) ← Depends on US1 working
  ↓
Phase 5 (US3: Both Break Types) ← Depends on US1 + US2 working
  ↓
Phase 6 (Polish & Edge Cases) ← Final validation
```

### Parallel Execution Opportunities

**Within Foundation Phase** (after T004 completes):

- T005 (utils.js) and T006 (en.json) can run in parallel (different files)

**Within US1 Phase** (after T006 completes):

- T007 (break.html) and T008 (microbreak.html) can run in parallel (identical changes, different files)
- After T009-T011 complete for break-renderer.js:
  - T012 (microbreak-renderer.js) can run independently (same changes, different file)

**Within US2 Phase** (after T013 completes):

- T014 (preferences.html) can run while T015-T017 are planned (HTML changes independent of JS)

**Within US3 Phase** (US1+US2 complete):

- All T020-T023 are manual tests, can be run in any order or batched

**Within Polish Phase** (all user stories complete):

- T024 (CSS), T025 (new tests), T026 (update tests) can run in parallel (different files)
- T029-T032 (manual edge case tests) can run in parallel

### Example Parallel Execution (US1 Phase)

**Session 1** (Foundation):

```bash
# Developer A
git checkout 001-skip-delay
# T004: Edit defaultSettings.js

# Developer B (can start after T004 commits)
# T005: Edit utils.js (canSkip function)

# Developer C (can start immediately)
# T006: Edit en.json (i18n strings)
```

**Session 2** (US1 Implementation):

```bash
# Developer A
# T007: Edit break.html (add countdown span)

# Developer B (parallel with A)
# T008: Edit microbreak.html (add countdown span)

# Developer C (waits for T007/T008, then)
# T009-T011: Edit break-renderer.js (full logic)

# Developer A (after T011 completes)
# T012: Edit microbreak-renderer.js (duplicate T009-T011 changes)
```

### Critical Path (No Parallelization)

**Minimum Sequential Steps** (if one person):

1. T001-T003 (setup verification)
2. T004 (defaultSettings - blocks everything)
3. T005, T006 (utils + i18n - parallel possible but small gain)
4. T007, T008 (HTML files - parallel possible)
5. T009-T011 (break-renderer - sequential within file)
6. T012 (microbreak-renderer - depends on T009-T011 pattern)
7. T013 (US1 manual test)
8. T014-T019 (US2 implementation + tests)
9. T020-T023 (US3 validation)
10. T024-T033 (Polish, can parallelize test creation vs manual testing)

**Total Time**: ~3 hours (matches quickstart.md estimate of 2.5 hours + polish)

---

## Implementation Strategy

### MVP-First Approach

**Phase 3 (US1) = Minimum Viable Product**

- Delivers core value: skip delay enforcement with countdown
- Can be released independently (requires manual config in electron-store, but functional)
- Validates user acceptance of delay concept before investing in UI

**Incremental Delivery After MVP**:

- **Phase 4 (US2)**: Adds convenience (UI configuration) but doesn't change core behavior
- **Phase 5 (US3)**: Validation only - confirms existing implementation works for both break types
- **Phase 6**: Quality & edge cases - hardens feature for production

### Suggested MVP Scope

**Include**:

- Phase 1 (Setup)
- Phase 2 (Foundation)
- Phase 3 (US1: Default Behavior)

**Optional for MVP**:

- Phase 4 (US2: Preferences UI) - nice-to-have, not blocking
- Phase 5 (US3: Validation) - confidence check, likely already works
- Phase 6 (Polish) - important for production, not for MVP validation

**Rationale**: MVP (through Phase 3) proves feature value. Can collect user feedback before investing in Preferences UI polish.

---

## Format Validation

**Checklist Format**: ✅ All tasks follow `- [ ] [ID] [P?] [Story?] Description with file path`

**Task IDs**: ✅ Sequential T001-T033

**[P] Markers**: ✅ Added to 12 parallelizable tasks (T002, T003, T006, T007, T008, T024, T025, T029, T030, T031, T032)

**[Story] Labels**: ✅ All user story tasks labeled:

- US1: T007-T013 (7 tasks)
- US2: T014-T019 (6 tasks)
- US3: T020-T023 (4 tasks)

**File Paths**: ✅ All implementation tasks specify exact file paths (app/utils/defaultSettings.js, app/break-renderer.js, etc.)

**Phases**:

- ✅ Phase 1: Setup (3 tasks)
- ✅ Phase 2: Foundational (3 tasks)
- ✅ Phase 3: US1 - Default Behavior (7 tasks)
- ✅ Phase 4: US2 - Configuration (6 tasks)
- ✅ Phase 5: US3 - Both Break Types (4 tasks)
- ✅ Phase 6: Polish (10 tasks)

**Total**: 33 tasks across 6 phases

---

## References

- Feature Spec: `specs/001-skip-delay/spec.md`
- Implementation Plan: `specs/001-skip-delay/plan.md`
- Research: `specs/001-skip-delay/research.md`
- Data Model: `specs/001-skip-delay/data-model.md`
- Quickstart Guide: `specs/001-skip-delay/quickstart.md` (detailed step-by-step for developers)
- Constitution: `.specify/memory/constitution.md`
