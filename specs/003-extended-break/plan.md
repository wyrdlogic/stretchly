# Implementation Plan: Extended Break Triggers

**Branch**: `003-extended-break` | **Date**: 2024-01-15 | **Spec**: [specs/003-extended-break/spec.md](spec.md)
**Input**: Feature specification from `/specs/003-extended-break/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

**Primary Requirement**: Enable users to configure one-time break duration extensions that trigger based on time-of-day (e.g., "first long break at or after 2:00 PM becomes 10 minutes") or consecutive break count (e.g., "every 3rd long break extends to 15 minutes").

**Technical Approach**:

- Add new settings key `extendedBreakTriggers` as array in electron-store
- Extend BreaksPlanner with trigger evaluation logic in existing `breakStarted` event handler
- Inject duration override before Scheduler creation (minimal change, preserves event flow)
- Add preferences UI section with table-based trigger management (CRUD via IPC)
- Use StandardJS style, ES modules, event-driven patterns throughout

## Technical Context

**Language/Version**: JavaScript ES6+ / Node.js 22.20.0  
**Primary Dependencies**: Electron 39.0.0+, electron-store 10.0+, electron-log, Vitest 4.0+  
**Storage**: electron-store (JSON persistence in `~/.config/Stretchly/config.json`)  
**Testing**: Vitest with chai assertions (existing pattern in `test/` directory)  
**Target Platform**: Cross-platform desktop (Windows, macOS, Linux via Electron)  
**Project Type**: Single desktop application (Electron main + renderer processes)  
**Performance Goals**: Trigger evaluation <5ms per break (negligible impact on break scheduling)  
**Constraints**:

- Event-driven architecture (EventEmitter-based)
- StandardJS code style NON-NEGOTIABLE (no semicolons, 2-space indent, single quotes)
- ES Modules only (`.js` extensions required in imports)
- Cross-platform compatibility (no platform-specific APIs except where abstracted)
- Accessibility (keyboard navigation, screen reader support)
**Scale/Scope**:
- Single feature module (1 new util file, extend 3 existing files, 1 new UI section)
- Expected trigger count: 1-10 per user (optimize for small arrays)
- Integration points: BreaksPlanner, preferences UI, settings persistence

## Constitution Check

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: User Health First ✅ PASS

**Evaluation**: Extended break triggers directly serve the mission by allowing users to customize break durations based on their personal health needs and work patterns. Time-of-day triggers accommodate natural energy rhythms (e.g., longer afternoon breaks), while count-based triggers provide regular deeper breaks during extended work sessions.

**Justification**: This feature enhances the core break reminder functionality rather than distracting from it. No bloat introduced - minimal code change, focused on break duration optimization.

### Principle II: Cross-Platform Consistency ✅ PASS

**Evaluation**: Implementation uses only standard JavaScript Date API and Electron platform-agnostic APIs (electron-store, EventEmitter). No platform-specific code required. Trigger evaluation logic identical on all platforms. UI uses existing Electron HTML/CSS patterns already tested cross-platform.

**Compliance**: All integration points (BreaksPlanner, Settings, IPC) already work identically across Windows, macOS, Linux. No new platform-specific abstractions needed.

### Principle III: StandardJS Code Style ✅ PASS

**Evaluation**: All code examples in research.md and quickstart.md follow StandardJS: no semicolons, 2-space indentation, single quotes, arrow functions, template literals. Code self-documenting (minimal comments).

**Compliance**: `npm run lint` will be run before PR merge. All new code in `extendedBreakTriggers.js` and BreaksPlanner methods follows existing codebase patterns.

### Principle IV: ES Modules Only ✅ PASS

**Evaluation**: All imports use ES Module syntax with explicit `.js` extensions (e.g., `import { createTrigger } from './utils/extendedBreakTriggers.js'`). No CommonJS usage. Export pattern matches existing codebase (`export default`, named exports).

**Compliance**: Module structure identical to existing utils (scheduler.js, naturalBreaksManager.js patterns).

### Principle V: Testing Before Merging ✅ PASS

**Evaluation**: Comprehensive test plan in quickstart.md includes:

- Unit tests for CRUD operations (createTrigger, updateTrigger, deleteTrigger)
- Unit tests for trigger evaluation logic (time-of-day, break-count, conflict resolution)
- Integration tests for BreaksPlanner interaction
- All tests use Vitest + chai (existing framework)
- Tests in `test/extendedBreakTriggers.js` matching source file pattern

**Compliance**: Critical functionality (trigger evaluation, settings persistence) has full test coverage. Tests must pass before PR merge.

### Principle VI: Accessibility ✅ PASS

**Evaluation**: Preferences UI follows existing patterns:

- Table structure with semantic HTML (`<table>`, `<th>`, `<td>`)
- Buttons accessible via keyboard (standard `<button>` elements)
- i18n keys for all UI text (screen reader compatible)
- Checkbox for enable/disable (standard control)
- Existing preferences window already keyboard-navigable

**Compliance**: No new accessibility barriers introduced. All UI elements reuse existing accessible components.

### Principle VII: Performance ✅ PASS

**Evaluation**: Trigger evaluation is O(n) where n = number of triggers (expected 1-10):

- Evaluated only when long break starts (~every 30-60 minutes)
- Simple iteration with early exit conditions
- No background timers or continuous polling
- Midnight reset uses string comparison (trivial cost)
- Settings read from in-memory electron-store cache (no disk I/O per evaluation)

**Compliance**: <5ms evaluation time for 10 triggers (negligible impact on break scheduling). No performance degradation.

### Summary: ALL GATES PASSED ✅

No constitution violations. No complexity justification required. Feature aligns with all core principles.

**Re-evaluation After Phase 1 Design**: All principles still satisfied. Data model and API contracts maintain compliance with constitution requirements.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

## Project Structure

### Documentation (this feature)

```text
specs/003-extended-break/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification (created by /speckit.specify)
├── research.md          # Phase 0 output (decisions, rationale, alternatives)
├── data-model.md        # Phase 1 output (entity schemas, validation, state)
├── quickstart.md        # Phase 1 output (developer implementation guide)
└── contracts/           # Phase 1 output (API contracts)
    └── api-contract.md  # Internal JavaScript APIs (CRUD, evaluation, IPC)
```

### Source Code (repository root)

```text
app/
├── breaksPlanner.js                      # MODIFIED: Add trigger evaluation methods
├── main.js                               # MODIFIED: Add IPC handlers for trigger CRUD
├── preferences.html                      # MODIFIED: Add trigger management UI section
├── preferences-renderer.js               # MODIFIED: Add trigger table rendering + CRUD
└── utils/
    ├── defaultSettings.js                # MODIFIED: Add extendedBreakTriggers: []
    └── extendedBreakTriggers.js          # NEW: CRUD functions + validation

test/
├── extendedBreakTriggers.js              # NEW: Unit tests for CRUD + validation
└── breaksPlanner.js                      # MODIFIED: Add trigger evaluation tests

app/locales/
└── en.json                               # MODIFIED: Add i18n keys for UI
    (repeat for other locales)

app/css/
└── preferences.css                       # MODIFIED: Add trigger table styles
```

**Structure Decision**: Single Electron application (existing structure). This feature extends existing codebase with:

- **1 new utility module** (`extendedBreakTriggers.js`) for trigger management logic
- **3 modified core files** (BreaksPlanner for evaluation, main.js for IPC, preferences for UI)
- **2 new test files** matching source structure pattern
- **Minimal UI changes** (1 new section in preferences.html, localized styles)

No new directories needed - follows existing patterns (utils for logic, test for tests, locales for i18n, css for styles).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations detected.** All constitution principles passed. No complexity justification required.

---

## Phase 0: Research & Design Decisions (COMPLETED)

All unknowns from Technical Context have been resolved. See [research.md](research.md) for full details.

### Key Decisions Made

1. **Break Duration Override Integration Point**
   - Decision: Inject in `BreaksPlanner.on('breakStarted')` event handler
   - Rationale: Single point where duration is read, minimal code change
   - File: `app/breaksPlanner.js` line 26

2. **Settings Persistence Schema**
   - Decision: Add `extendedBreakTriggers: []` array to defaultSettings.js
   - Rationale: electron-store handles JSON serialization automatically
   - No migration needed (defaults to empty array)

3. **Midnight Reset Mechanism**
   - Decision: Compare `Date.toDateString()` on each trigger evaluation
   - Rationale: Handles sleep/wake, time changes, DST automatically
   - No background timers required

4. **Idle Time Integration**
   - Decision: No changes needed to existing idle detection
   - Rationale: `NaturalBreaksManager.emit('clearBreakScheduler')` already cancels extended breaks
   - Trigger state preserved correctly (time-of-day: used today, break-count: reset)

5. **Multiple Trigger Conflict Resolution**
   - Decision: "Longest duration wins" strategy
   - Rationale: Simplest approach, matches user intent for longer breaks

6. **Break Type Filtering**
   - Decision: Only evaluate triggers when `_scheduledBreakType === 'break'`
   - Rationale: Long breaks only (per spec clarification Q6)

All research documented in [research.md](research.md) with alternatives considered and rejected.

---

## Phase 1: Data Model & Contracts (COMPLETED)

### Data Model

Full entity schema defined in [data-model.md](data-model.md). Summary:

**ExtendedBreakTrigger Entity:**

- Fields: id (UUID), enabled (bool), type (enum), timeOfDay (string?), breakCount (number?), duration (number)
- Validation: Cross-field rules, format validation, uniqueness constraints
- State Management: In-memory (`triggeredTodayIds`, `lastTriggerEvaluationDate`) + Persisted (`extendedBreakTriggers` array)
- Lifecycle: CRUD operations with validation at each step

**State Machines:**

- Time-of-Day: Created → Enabled & Waiting → Triggered → Used Today → [Midnight Reset] → Enabled & Waiting
- Break-Count: Created → Enabled & Counting → Triggered → [Idle Reset] → Enabled & Counting

### API Contracts

Full contracts defined in [contracts/api-contract.md](contracts/api-contract.md). Summary:

**Settings CRUD API** (5 functions in `app/utils/extendedBreakTriggers.js`):

- `createTrigger(settings, config)` → ExtendedBreakTrigger
- `getTriggers(settings)` → Array<ExtendedBreakTrigger>
- `getTriggerById(settings, id)` → ExtendedBreakTrigger | null
- `updateTrigger(settings, id, updates)` → ExtendedBreakTrigger
- `deleteTrigger(settings, id)` → void

**Trigger Evaluation API** (6 private methods in `app/breaksPlanner.js`):

- `_getBreakDuration()` → number (entry point)
- `_evaluateExtendedBreakTriggers()` → number | null
- `_evaluateSingleTrigger(trigger)` → number | null
- `_evaluateTimeOfDayTrigger(trigger)` → number | null
- `_evaluateBreakCountTrigger(trigger)` → number | null
- `_resetDailyStateIfNeeded()` → void

**IPC Communication API** (4 channels):

- `get-extended-break-triggers` → { success, data }
- `create-extended-break-trigger` → { success, data } | { success: false, error }
- `update-extended-break-trigger` → { success, data } | { success: false, error }
- `delete-extended-break-trigger` → { success } | { success: false, error }

### Developer Quickstart

Implementation guide with 10 steps provided in [quickstart.md](quickstart.md):

1. Add default setting
2. Create trigger management utilities
3. Extend BreaksPlanner with evaluation logic
4. Add IPC handlers in main.js
5. Add UI to preferences.html
6. Implement preferences renderer logic
7. Add i18n translations
8. Write tests (Vitest)
9. Run linter and tests
10. Manual testing checklist

Estimated implementation time: 6-8 hours for experienced developer.

---

## Phase 2: Task Breakdown (NOT YET CREATED)

**Next Command**: Run `/speckit.tasks` to generate detailed implementation tasks from this plan.

The tasks command will break down the implementation into atomic, testable work units following the structure defined in this plan.

---

## Summary

### Planning Status: ✅ COMPLETE

**Branch**: `003-extended-break`  
**Spec Path**: `c:\Code\WyrdLogic\stretchly\specs\003-extended-break\spec.md`  
**Plan Path**: `c:\Code\WyrdLogic\stretchly\specs\003-extended-break\plan.md`

### Artifacts Generated

1. ✅ **research.md** (10 decisions documented with alternatives)
2. ✅ **data-model.md** (entity schemas, validation, state machines)
3. ✅ **contracts/api-contract.md** (15+ API contracts defined)
4. ✅ **quickstart.md** (10-step implementation guide)
5. ✅ **plan.md** (this file - technical context, constitution check, structure)
6. ✅ **Agent context updated** (.github/agents/copilot-instructions.md)

### Constitution Compliance

All 7 core principles verified:

- ✅ User Health First (enhances core mission)
- ✅ Cross-Platform Consistency (no platform-specific code)
- ✅ StandardJS Code Style (all examples compliant)
- ✅ ES Modules Only (explicit .js extensions)
- ✅ Testing Before Merging (comprehensive test plan)
- ✅ Accessibility (keyboard nav, screen readers)
- ✅ Performance (O(n) evaluation, <5ms impact)

### Technical Approach Validated

**Integration Point**: BreaksPlanner.on('breakStarted') event handler (line 26)  
**Data Storage**: electron-store with `extendedBreakTriggers: []` array  
**UI Pattern**: Table-based CRUD in preferences.html (matches existing patterns)  
**Testing**: Vitest unit + integration tests in test/ directory  
**Code Style**: StandardJS, ES Modules, event-driven architecture

### Next Steps

1. Run `/speckit.tasks` to generate implementation task breakdown
2. Implement feature following quickstart.md guide
3. Write tests matching test plan in contracts/api-contract.md
4. Run `npm run lint` and `npm test` before PR
5. Manual test using checklist in quickstart.md Step 10
6. Update CHANGELOG.md with feature description
7. Translate UI strings to all supported locales

### Estimated Effort

- **Implementation**: 6-8 hours (1 developer)
- **Testing**: 2-3 hours (unit + integration + manual)
- **Localization**: 1-2 hours (translate to 50+ locales)
- **Total**: ~10-13 hours

**Complexity**: Medium (requires Electron, event-driven, time-based logic knowledge)
