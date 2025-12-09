# Implementation Plan: Configurable Skip Delay

**Branch**: `001-skip-delay` | **Date**: 2025-12-09 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-skip-delay/spec.md`

## Summary

Add configurable delay before skip button becomes active during breaks. Feature includes an enable/disable toggle (default: disabled) and configurable duration (default: 30 seconds, range: 1-300 seconds when enabled). Visual countdown is MANDATORY when delay is active. Implementation leverages existing Stretchly patterns: electron-store for settings persistence, existing preferences UI patterns (checkbox + range input), and existing break window timer mechanisms. No new dependencies required.

## Technical Context

**Language/Version**: JavaScript (ES Modules) with Node.js 22.20.0, Electron 39.0.0  
**Primary Dependencies**: electron-store (settings persistence), i18next (internationalization), Electron IPC (main/renderer communication)  
**Storage**: electron-store with two new boolean and number settings (skipDelayEnabled: false, skipDelayDuration: 30000ms)  
**Testing**: Vitest 4.0+ with new tests in test/skipDelay.js for canSkip() logic and countdown calculations  
**Target Platform**: Cross-platform desktop (Windows, macOS, Linux) - no platform-specific code required  
**Project Type**: Electron desktop application - modifying existing app structure  
**Performance Goals**: Skip button state update <200ms after delay expiration, countdown UI update at 1-second intervals  
**Constraints**: StandardJS style (NON-NEGOTIABLE: no semicolons, 2-space indent, single quotes), ES Modules with .js extensions, <200ms UI latency per Constitution Principle VII  
**Scale/Scope**: Small feature affecting 7 files (1 settings, 2 HTML, 2 renderers, 1 utils, 1 locale + Weblate translations)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle I: User Health First

**Status**: PASS  
**Justification**: Feature directly supports mission by preventing impulsive skip behavior, encouraging users to acknowledge breaks before dismissing them. Optional nature (disabled by default) respects user autonomy while promoting healthier habits.

### ✅ Principle II: Cross-Platform Consistency

**Status**: PASS  
**Justification**: No platform-specific code required. Feature uses Electron timer APIs and DOM manipulation that work identically on Windows, macOS, and Linux. No platform-specific isolation needed.

### ✅ Principle III: StandardJS Code Style (NON-NEGOTIABLE)

**Status**: PASS  
**Justification**: All code will follow StandardJS: no semicolons, 2-space indent, single quotes, ES6+ features. Will pass `npm run lint` before merge.

### ✅ Principle IV: ES Modules Only

**Status**: PASS  
**Justification**: All new code uses ES Modules with explicit .js extensions. Import statements at top of files. Example: `import utils from './utils/utils.js'`

### ✅ Principle V: Testing Before Merging

**Status**: PASS  
**Justification**: Will add `test/skipDelay.js` with Vitest tests for:

- canSkip() logic with skipDelayEnabled parameter
- Countdown calculation edge cases (sleep/resume, delay > break duration)
- Integration with strict mode
- Validation rules (1-300 second range, no zero when enabled)

### ✅ Principle VI: Accessibility Standards

**Status**: PASS  
**Justification**:

- Skip countdown uses aria-hidden="true" (prevents screen reader spam per existing pattern)
- Checkbox and range inputs have proper <label for="..."> attributes
- Keyboard navigation maintained (existing focus management)
- Disabled skip button already keyboard-inaccessible (existing pattern)

### ✅ Principle VII: Performance and Resource Efficiency

**Status**: PASS  
**Justification**:

- Reuses existing 100ms setInterval (no new timer)
- Skip button state update <200ms (simple boolean check)
- Countdown calculation is simple arithmetic (Date.now() - started)
- Minimal DOM updates (1 span element for countdown)
- No memory leaks (existing timer cleanup patterns apply)

### Summary

**All 7 constitution principles: PASS**  
No violations. Feature aligns with all established Stretchly development standards.

## Project Structure

### Documentation (this feature)

```text
specs/001-skip-delay/
├── spec.md              # Feature specification (user stories, requirements)
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0 output (technical patterns and decisions)
├── data-model.md        # Phase 1 output (entities and state model)
├── quickstart.md        # Phase 1 output (developer setup guide)
├── contracts/           # Phase 1 output (settings schema, IPC contracts)
│   └── settings.schema.json
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── utils/
│   ├── defaultSettings.js        # MODIFY: Add skipDelayEnabled, skipDelayDuration
│   ├── utils.js                  # MODIFY: Update canSkip() signature and logic
│   └── context-bridge-exposers.js # VERIFY: canSkip exposure already present
├── break.html                    # MODIFY: Add skip-countdown span element
├── microbreak.html               # MODIFY: Add skip-countdown span element
├── break-renderer.js             # MODIFY: Add countdown display logic, pass skipDelay params to canSkip()
├── microbreak-renderer.js        # MODIFY: Add countdown display logic, pass skipDelay params to canSkip()
├── preferences.html              # MODIFY: Add skipDelay checkbox, range input, help text
├── preferences-renderer.js       # MODIFY: Add enable/disable logic for duration input
├── locales/
│   └── en.json                   # MODIFY: Add skip delay strings (Weblate handles other langs)
└── css/
    └── break.css                 # MODIFY (optional): Style skip-countdown element

test/
└── skipDelay.js                  # CREATE: New test file for skip delay logic
```

**Structure Decision**: Electron desktop application structure. Feature modifies existing files rather than creating new modules. Follows established pattern of utils for logic, renderers for UI behavior, HTML for structure, locales for i18n. No new architectural layers needed.

## Complexity Tracking

> **No violations - this section intentionally left empty.**

All Constitution checks passed. No complexity justifications needed.
