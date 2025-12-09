<!--
Sync Impact Report (Constitution v1.0.0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Version Change: INITIAL → 1.0.0

Modified Principles:
  - Initial creation of all principles based on codebase analysis

Added Sections:
  - Core Principles (7 principles)
  - Technical Standards
  - Development Workflow
  - Governance

Templates Requiring Updates:
  ✅ plan-template.md - already aligned with constitution requirements
  ✅ spec-template.md - already aligned with user story focus
  ✅ tasks-template.md - already aligned with test-first approach

Follow-up TODOs:
  - None (initial constitution creation)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-->

# Stretchly Constitution

## Core Principles

### I. User Health First
All features MUST serve the primary mission: promoting healthy computer use through effective break reminders. Features that do not directly support this mission MUST be justified against bloat and complexity. The application MUST remain simple, accessible, and focused on its core purpose of protecting user health through regular breaks and stretches.

**Rationale**: Stretchly exists to combat sedentary work habits and prevent repetitive strain injuries. Feature creep that distracts from this mission undermines the application's effectiveness and user trust.

### II. Cross-Platform Consistency
Code MUST maintain compatibility across Windows, macOS, and Linux. Platform-specific code MUST be isolated in dedicated modules with clear abstractions. All features MUST be tested on all supported platforms before release. UI and UX MUST provide equivalent functionality across platforms while respecting platform conventions.

**Rationale**: Users switch between platforms and deserve a consistent experience. Platform-specific bugs erode trust and create support burden.

### III. StandardJS Code Style (NON-NEGOTIABLE)
All JavaScript code MUST follow StandardJS conventions: no semicolons, 2-space indentation, single quotes for strings. Code MUST pass `npm run lint` without warnings. ES6+ features (arrow functions, destructuring, const/let, template literals) are preferred over legacy syntax. Code MUST be self-documenting; avoid comments except for complex algorithms or non-obvious decisions.

**Rationale**: Consistent style eliminates bikeshedding and makes code review focus on logic rather than formatting. StandardJS provides zero-config linting that enforces community best practices.

### IV. ES Modules Only
All code MUST use ES Modules (ESM) with explicit `.js` extensions in imports. No CommonJS `require()` syntax is permitted in new code. Module exports MUST use `export default` or named exports. Import statements MUST appear at the top of files.

**Rationale**: ESM is the JavaScript standard and ensures future compatibility. Explicit extensions prevent module resolution ambiguity in Electron/Node environments.

### V. Testing Before Merging
New features and bug fixes SHOULD include tests when feasible. Tests MUST use Vitest framework. Tests MUST be placed in `test/` directory matching the source file name. Critical functionality (schedulers, break logic, settings persistence) MUST have test coverage. Tests MUST pass before PR merge.

**Rationale**: While not requiring TDD, tests prevent regressions and document expected behavior. Critical paths affecting user break schedules require verification.

### VI. Accessibility Standards
User interfaces MUST be keyboard navigable. Interactive elements MUST have appropriate ARIA attributes where semantic HTML is insufficient. Progress indicators and timers MUST have `aria-hidden="true"` to avoid screen reader spam. Color schemes MUST maintain sufficient contrast. Breaks MUST be noticeable but not disruptive to assistive technologies.

**Rationale**: Break reminder software must be accessible to users with disabilities, who may benefit most from ergonomic break schedules.

### VII. Performance and Resource Efficiency
The application MUST have minimal resource footprint when idle. Break windows MUST render within 200ms of trigger. Background processes MUST use efficient polling/event patterns to avoid CPU waste. Electron APIs MUST be used appropriately to minimize overhead. Memory leaks in long-running processes are unacceptable.

**Rationale**: As a background reminder app running continuously, Stretchly must not burden system resources or drain laptop batteries.

## Technical Standards

### Technology Stack
- **Runtime**: Node.js 22.20.0 (per package.json engines field)
- **Framework**: Electron 39.0.0+ for cross-platform desktop
- **Language**: JavaScript with ES Modules (ESM)
- **Testing**: Vitest 4.0+ with Istanbul coverage
- **Linting**: StandardJS 17.1+
- **Build**: electron-builder 26.0+

### Project Structure
```
app/                    # Main application code
  main.js              # Electron main process
  break.html           # Long break window
  microbreak.html      # Short break window
  preferences.html     # Settings window
  utils/               # Shared utilities and managers
test/                  # Unit and integration tests
build/                 # Build configuration
app/locales/           # i18n translations (Weblate managed)
```

### Module Patterns
- Event-driven architecture using Node.js EventEmitter for managers
- Scheduler class for timing break intervals
- Settings persistence via electron-store
- Platform-specific managers (DND, app exclusions) with fallback behavior
- Clear separation between main process and renderer processes

### Dependencies
- Prefer native Node.js modules over external libraries
- External dependencies MUST be justified for significant functionality
- Keep dependency tree minimal to reduce security surface
- Use platform-specific packages only when necessary (e.g., windows-focus-assist)

## Development Workflow

### Feature Development Process
1. Open GitHub Issue BEFORE implementing features to discuss approach
2. Discuss design decisions: Why add it? How should it work? Where does it fit?
3. Create feature branch from default branch (trunk)
4. Implement with tests when feasible
5. Add entry to CHANGELOG.md
6. Add yourself to Contributors list in README.md
7. Update screenshots in README.md if UI changed
8. Submit PR following PULL_REQUEST_TEMPLATE
9. Ensure CI passes (lint, tests, builds)
10. Address review feedback
11. Maintainer merges when approved

### Code Review Requirements
- All PRs MUST be reviewed before merge
- PRs MUST pass `npm run lint` without errors
- PRs MUST pass `npm test` without failures
- Breaking changes MUST be discussed in issue before implementation
- Version numbers are managed by maintainers (do not edit)

### Internationalization
- UI text MUST use i18next for translations
- New strings MUST be added to `app/locales/en.json`
- Translations are managed via Weblate (community contributed)
- Text MUST not be hardcoded in UI components

### Commit Standards
- Commits SHOULD be atomic and focused
- Commit messages SHOULD be descriptive
- No specific format required (project uses natural language commits)

## Governance

### Constitution Authority
This constitution documents established practices observed in the Stretchly codebase and contributor guidelines. It codifies patterns for consistency in feature development and reviews. All PRs should align with these principles.

### Amendment Process
Constitution amendments require:
1. GitHub Issue documenting proposed change with rationale
2. Maintainer approval
3. Version bump following semantic versioning:
   - MAJOR: Principle removal or backward-incompatible policy changes
   - MINOR: New principle or section added
   - PATCH: Clarifications, wording improvements, non-semantic changes
4. Update of LAST_AMENDED_DATE to amendment date

### Complexity Justification
Features that violate principles (e.g., add complexity, reduce cross-platform support) MUST provide written justification in the GitHub Issue. Maintainer has final authority on accepting violations.

### Runtime Guidance
For AI-assisted development, refer to `.github/copilot-instructions.md` for coding patterns, style preferences, and project-specific context.

**Version**: 1.0.0 | **Ratified**: 2025-12-09 | **Last Amended**: 2025-12-09
