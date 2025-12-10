# Implementation Plan: Strict Mode Skip Friction

**Branch**: `002-strict-mode-password` | **Date**: December 10, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-strict-mode-password/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Introduce friction to skipping breaks in strict mode by requiring users to type a randomly-generated complex string character-by-character with visual feedback. Features include:

- Random string generation with numbers, letters, and special characters (`!@#$%^&*()_+-=[]{}|;:,.<>?`)
- Character-by-character input with real-time color feedback (green/correct, red/incorrect, transparent/empty)
- Incremental friction that increases difficulty based on sequential skips (1 word for 1st skip, 2 words for 2nd, up to configurable maximum default 5)
- Separate tracking for mini breaks and long breaks (independent total and sequential counters)
- Statistics display showing total skips and sequential skip count during friction interface
- Configurable character length per word (default 20) and maximum words for incremental friction
- Feature enabled by default when strict mode is enabled

**Technical Approach**: Leverage existing Stretchly patterns for settings persistence (electron-store), break window rendering (Electron IPC), and preferences UI. No new dependencies required. Implementation follows StandardJS, ES Modules, and existing break window patterns.

## Technical Context

**Language/Version**: JavaScript (ES Modules) with Node.js 22.20.0, Electron 39.0.0  
**Primary Dependencies**: 
- electron-store (settings persistence)
- i18next (internationalization)
- Electron IPC (main/renderer communication)
- Vitest 4.0+ (testing framework)
- StandardJS 17.1+ (linting)

**Storage**: electron-store for user preferences (JSON file in user data directory)  
**Testing**: Vitest with unit tests for utility functions and integration tests for friction logic  
**Target Platform**: Cross-platform (Windows, macOS, Linux) - Electron desktop application  
**Project Type**: Single Electron desktop application with main process and multiple renderer processes  
**Performance Goals**: 
- Friction interface appears within 1 second of skip attempt
- Visual feedback (color change) appears within 100ms of character entry
- Interface remains responsive with up to 100 characters (5 words × 20 chars)

**Constraints**: 
- Must follow StandardJS code style (no semicolons, 2-space indentation, ES6+)
- Must use ES Modules only (no CommonJS require())
- Must maintain cross-platform compatibility
- Must integrate with existing break window architecture
- Must preserve existing strict mode behavior when friction is disabled

**Scale/Scope**: 
- 8 new persistent settings (4 for mini breaks, 4 for long breaks)
- 4 new counters (total and sequential for each break type)
- New friction interface UI in break windows
- New preferences UI section for configuration
- Estimated 800-1000 LOC across all files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **I. User Health First**: Feature directly supports core mission by making strict mode more practical - allows emergency skips while maintaining discipline through friction. Prevents users from disabling strict mode entirely due to inflexibility.

✅ **II. Cross-Platform Consistency**: No platform-specific code required. Feature uses standard Electron APIs and web technologies (HTML, CSS, JavaScript) that work identically across Windows, macOS, and Linux.

✅ **III. StandardJS Code Style**: All implementation will follow StandardJS conventions - no semicolons, 2-space indentation, single quotes, ES6+ features.

✅ **IV. ES Modules Only**: Implementation uses ES Modules throughout with explicit `.js` extensions in imports.

✅ **V. Testing Before Merging**: Will include comprehensive Vitest tests for:
- Random string generation logic
- Character validation and word counting
- Counter increment/reset logic
- Settings persistence
- Integration with existing strict mode

✅ **VI. Accessibility Standards**: 
- Friction interface keyboard navigable
- ARIA labels for screen readers on statistics display
- Color scheme maintains sufficient contrast (green/red with visual column separation)
- Statistics use `aria-live` for real-time updates

✅ **VII. Performance and Resource Efficiency**: 
- Random string generation on-demand (not continuous)
- Minimal DOM manipulation (reuse elements, efficient updates)
- Counter persistence batched with other settings changes
- No continuous polling - event-driven architecture

**GATE RESULT**: ✅ PASS - No violations. Feature aligns with all constitution principles.

## Project Structure

### Documentation (this feature)

```text
specs/002-strict-mode-password/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (generated below)
├── data-model.md        # Phase 1 output (generated below)
├── quickstart.md        # Phase 1 output (generated below)
├── contracts/           # Phase 1 output (generated below)
│   ├── settings.md      # electron-store settings schema
│   ├── ui-components.md # Friction interface component spec
│   └── ipc.md           # Main/renderer IPC contracts
└── checklists/
    └── requirements.md  # Specification validation checklist (complete)
```

### Source Code (repository root)

```text
app/
├── main.js                              # [MODIFY] Add friction counter management
├── break.html                           # [MODIFY] Add friction interface HTML
├── break-renderer.js                    # [MODIFY] Add friction interface logic
├── microbreak.html                      # [MODIFY] Add friction interface HTML
├── microbreak-renderer.js               # [MODIFY] Add friction interface logic
├── preferences.html                     # [MODIFY] Add friction settings UI
├── preferences-renderer.js              # [MODIFY] Add friction settings handling
├── css/
│   └── break.css                        # [MODIFY] Add friction interface styles
└── utils/
    ├── defaultSettings.js               # [MODIFY] Add 8 new default settings
    ├── utils.js                         # [MODIFY] Update canSkip() for friction
    └── frictionGenerator.js             # [NEW] Random string generation logic

test/
├── utils.js                             # [MODIFY] Add friction canSkip tests
├── frictionGenerator.js                 # [NEW] String generation tests
└── frictionCounters.js                  # [NEW] Counter logic tests

app/locales/
└── en.json                              # [MODIFY] Add i18n keys for friction UI
```

**Structure Decision**: Using existing Stretchly Electron app structure. Feature integrates into existing break window renderers and preferences system. No new directories required - follows established patterns of break window modifications (similar to skip delay feature in specs/001).

Key integration points:
- Settings: Add to `defaultSettings.js` following existing `skipDelayEnabled` pattern
- Break windows: Modify existing `break-renderer.js` and `microbreak-renderer.js`
- Preferences: Add UI section under strict mode settings
- Utils: New `frictionGenerator.js` module for string generation, modify `canSkip()` in `utils.js`

## Complexity Tracking

**No violations to justify** - Constitution Check passed all 7 principles.

### Overall Complexity Rating

**Estimated Complexity**: ⭐⭐ (2/5 - Moderate)

- **UI Complexity**: Low-Moderate (Single modal interface with character-by-character display)
- **Logic Complexity**: Low-Moderate (Random string generation + input validation)
- **State Complexity**: Moderate (8 settings + 4 counters with persistence)
- **Integration Complexity**: Low (Extends existing break window logic using established patterns)

### Justification

**Simple aspects:**
- Follows established patterns from specs/001-skip-delay (skip delay countdown)
- Uses existing electron-store for settings persistence
- Minimal cross-component interaction (break windows + preferences only)
- Standard character-by-character UI (no complex animations)
- Existing `canSkip()` utility provides integration point

**Moderate aspects:**
- Incremental friction formula requires counter persistence and reset logic
- Separate tracking for mini/long breaks (4 counters total)
- Character-by-character visual feedback requires careful state management
- Random string generation with balanced character distribution (not trivial RNG)
- Cross-platform clipboard prevention during input

**No complex aspects identified** (no async coordination, external APIs, complex state machines)

### Risk Assessment

- **Technical Risk**: LOW (all dependencies already in use, no new packages required)
- **UX Risk**: MODERATE (incremental friction may require tuning after user feedback)
- **Regression Risk**: LOW (isolated to strict mode code paths, existing tests cover integration points)

**Phase 0 readiness**: All unknowns resolved via clarifications. Ready to proceed with research.md generation.
