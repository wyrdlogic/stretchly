# Feature Specification: Configurable Skip Delay

**Feature Branch**: `001-skip-delay`  
**Created**: 2025-12-09  
**Status**: Draft  
**Input**: User description: "Add configurable delay before skip button becomes active during breaks. The delay should default to 30 seconds but be configurable by users in preferences."

## Clarifications

### Session 2025-12-09

- Q: Should the feature have an enable/disable toggle control? → A: Yes, add an enable/disable flag similar to how short and long breaks are selectable in preferences
- Q: When the feature is enabled, should users be allowed to set delay to 0 seconds? → A: No, when enabled the delay time cannot be zero (must be at least 1 second)
- Q: Is the visual countdown display mandatory or optional? → A: Mandatory - the visual countdown until users can skip MUST be displayed

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Default Skip Delay Behavior (Priority: P1)

When skip delay is enabled, users are presented with a break window that enforces a minimum viewing time before allowing skip. This prevents impulsive skipping and ensures users take a moment to acknowledge the break, promoting healthier work habits. A visual countdown clearly shows when the skip button will become available.

**Why this priority**: Core feature that delivers immediate health benefit by preventing users from instantly dismissing breaks without considering their wellbeing. This is the MVP that validates the feature's value.

**Independent Test**: Can be fully tested by enabling skip delay, triggering any break (micro or long), and verifying the skip button is disabled for the first 30 seconds with a visible countdown, then becomes enabled. Delivers value by ensuring minimum break acknowledgment time.

**Acceptance Scenarios**:

1. **Given** skip delay is enabled and a break window is triggered, **When** the break first appears, **Then** the skip button is disabled/hidden and cannot be clicked
2. **Given** skip delay is enabled and a break has been active for less than 30 seconds, **When** the user attempts to skip, **Then** the action is prevented and no skip occurs
3. **Given** skip delay is enabled and a break has been active for exactly 30 seconds, **When** the timer reaches this threshold, **Then** the skip button becomes enabled/visible
4. **Given** skip delay is enabled and a break has been active for more than 30 seconds, **When** the user clicks skip, **Then** the break ends normally as it does today
5. **Given** skip delay is enabled and the skip button is disabled, **When** the user views the break window, **Then** a visual countdown is displayed showing the remaining time until skip becomes available (MANDATORY)
6. **Given** skip delay is disabled, **When** a break window appears, **Then** the skip button is immediately available (current default behavior)

---

### User Story 2 - Configurable Skip Delay in Preferences (Priority: P2)

Users can enable/disable the skip delay feature and customize its duration in the Preferences window to match their personal health needs and work patterns. The feature includes an enable/disable toggle (similar to short/long break toggles) and a duration setting that only accepts values of 1 second or more when enabled.

**Why this priority**: Provides flexibility for different user needs without changing default behavior. Can be implemented independently after P1 is working.

**Independent Test**: Can be tested by opening Preferences, toggling skip delay on/off, changing the delay value, triggering a break, and verifying the configuration is enforced. Delivers value by accommodating individual user needs.

**Acceptance Scenarios**:

1. **Given** the Preferences window is open, **When** the user navigates to the break settings section, **Then** a skip delay enable/disable toggle and duration configuration option are visible
2. **Given** skip delay is disabled, **When** the user attempts to modify the delay duration, **Then** the duration input is disabled/grayed out
3. **Given** skip delay is enabled and the duration input field is active, **When** the user enters a valid number (1-300 seconds), **Then** the value is accepted and saved
4. **Given** skip delay is enabled and the duration input field is active, **When** the user attempts to enter 0 or leave it empty, **Then** the input is rejected with validation error (minimum 1 second required)
5. **Given** a custom skip delay has been configured and enabled, **When** a break is triggered, **Then** the break enforces the custom delay instead of the default 30 seconds
6. **Given** the user has not configured skip delay, **When** preferences are loaded, **Then** the feature is disabled by default with a default duration value of 30 seconds shown
7. **Given** the preferences window, **When** the user views the skip delay setting, **Then** helpful text explains what the setting controls and the enable/disable toggle

---

### User Story 3 - Skip Delay Applies to Both Break Types (Priority: P3)

The skip delay setting applies consistently to both microbreaks (short breaks) and long breaks, with the option to configure them independently if needed.

**Why this priority**: Ensures consistent behavior across break types. May be delivered after P1 and P2 if independent configuration isn't initially needed.

**Independent Test**: Can be tested by configuring skip delay, then triggering both a microbreak and a long break, verifying both respect the setting. Delivers value by ensuring predictable behavior.

**Acceptance Scenarios**:

1. **Given** a skip delay is configured, **When** a microbreak is triggered, **Then** the skip delay is enforced
2. **Given** a skip delay is configured, **When** a long break is triggered, **Then** the same skip delay is enforced
3. **Given** both break types use the same setting, **When** the user changes skip delay, **Then** both break types immediately use the new value

---

### Edge Cases

- What happens when skip delay is disabled? (Skip button is immediately available, restoring current default behavior)
- What happens when skip delay is enabled but user tries to set delay to 0 seconds? (Input validation prevents this; minimum 1 second required when enabled)
- What happens when skip delay is set to a value longer than the break duration? (Skip button should become available at the delay time or when break would normally end, whichever comes first)
- What happens when user closes/dismisses break window during the skip delay countdown? (Should be prevented, or countdown should continue if break respawns)
- What happens to skip delay when strict mode is enabled? (Skip delay should be irrelevant since skipping is already disabled in strict mode; strict mode takes precedence)
- What happens during resume from suspend/sleep while skip delay countdown is active? (Should recalculate remaining delay time based on actual elapsed wall time)
- What happens when postpone functionality is used? (Skip delay should apply to postponed break when it re-triggers)
- What happens on very short breaks where skip delay > break duration? (Skip should become available when break naturally ends)
- What happens when user changes skip delay setting while a break is active? (Current break should continue with original delay, new setting applies to next break)
- What happens when user disables skip delay while a break countdown is active? (Current break should complete its countdown; new disabled state applies to next break)
- What happens if visual countdown display fails to render? (Feature should gracefully degrade but countdown timer must still enforce delay; this is a critical bug if countdown cannot be shown since display is MANDATORY)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an enable/disable toggle for skip delay feature in preferences (similar to short/long break enable toggles)
- **FR-002**: System MUST default skip delay feature to disabled state when no user preference is set
- **FR-003**: System MUST display skip button as disabled/inactive when break window appears and skip delay is enabled
- **FR-004**: System MUST enforce a configurable delay period before enabling the skip button when feature is enabled
- **FR-005**: System MUST default skip delay duration to 30 seconds when feature is enabled
- **FR-006**: System MUST persist both enable/disable state and duration preference across application restarts
- **FR-007**: System MUST provide a preferences UI control for configuring skip delay duration
- **FR-008**: System MUST disable/gray out duration input when skip delay feature is disabled
- **FR-009**: System MUST validate skip delay input to accept only values between 1 and 300 seconds when feature is enabled
- **FR-010**: System MUST reject attempts to set delay to 0 seconds when feature is enabled (minimum 1 second required)
- **FR-011**: System MUST display visual countdown showing remaining time until skip becomes available (MANDATORY - not optional)
- **FR-012**: System MUST update visual countdown at least once per second during delay period
- **FR-013**: System MUST apply skip delay to both microbreaks and long breaks when enabled
- **FR-014**: System MUST allow immediate skip when skip delay feature is disabled (current default behavior)
- **FR-015**: System MUST handle skip delay countdown correctly when system resumes from sleep/suspend
- **FR-016**: System MUST respect strict mode setting (strict mode takes precedence; skip delay irrelevant when strict mode prevents skipping entirely)
- **FR-017**: System MUST make skip button available after delay period elapses OR when break duration would naturally end, whichever comes first
- **FR-018**: System MUST add skip delay enable/disable toggle and duration setting to preferences with clear labels and help text
- **FR-019**: System MUST include skip delay UI strings in internationalization for translation

### Key Entities

- **Skip Delay Enable State**: Boolean preference stored in electron-store indicating whether skip delay feature is active. Default value: false (disabled)
- **Skip Delay Duration Preference**: User-configurable setting stored in electron-store, representing the number of seconds to wait before enabling skip button. Default value: 30, Range: 1-300 (only enforced when feature is enabled)
- **Break Window State**: Tracks elapsed time since break started to determine when skip delay threshold is reached and button should be enabled
- **Skip Button UI Element**: Visual component that transitions from disabled to enabled state after delay period
- **Visual Countdown Display**: MANDATORY UI component showing remaining seconds until skip becomes available (e.g., "Skip available in 27s")

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When skip delay is enabled, users cannot skip breaks within the configured delay period (1-30 seconds default), measured by attempting skip clicks during countdown
- **SC-002**: When skip delay is disabled, users can skip breaks immediately (current behavior maintained)
- **SC-003**: Visual countdown display is visible and updates at least once per second during delay period (MANDATORY requirement)
- **SC-004**: Skip button becomes available within 100ms of delay period completion, measured by timestamp comparison
- **SC-005**: Skip delay enable/disable state and duration preference both persist across application restarts, verified by closing and reopening application
- **SC-006**: Users can configure skip delay between 1-300 seconds via Preferences UI when feature is enabled, verified by setting and testing different values
- **SC-007**: Users cannot set delay to 0 seconds when feature is enabled; validation prevents invalid input
- **SC-008**: Duration input is disabled/grayed out when skip delay feature is disabled
- **SC-009**: Feature respects existing strict mode behavior (when strict mode enabled, skip delay is overridden by skip prohibition)
- **SC-010**: Break window skip functionality remains under 200ms latency after delay period elapses (per Constitution Principle VII)

## Assumptions

- Skip delay feature is disabled by default to maintain backward compatibility with existing user behavior
- Skip delay applies equally to both microbreaks and long breaks (no separate configuration needed initially)
- Visual countdown display is MANDATORY and must always be shown when skip delay is active
- Enable/disable toggle follows same UI pattern as existing break type toggles (microbreak/long break enable checkboxes)
- When feature is disabled, duration input is grayed out but shows the configured value
- When feature is enabled, minimum delay is 1 second (no zero-delay option available)
- Existing skip keyboard shortcuts (if any) should also respect the delay when feature is enabled
- Skip delay countdown starts from break window display, not from scheduled break time
- Maximum delay of 300 seconds (5 minutes) is reasonable upper bound to prevent configuration of excessively long delays
- Postpone functionality is separate from skip; postponed breaks re-trigger with full skip delay countdown
- When system sleep/resume occurs during countdown, delay should be recalculated based on actual elapsed wall-clock time (not CPU time)

## Out of Scope

- Separate skip delay configurations for microbreaks vs long breaks (single enable/disable and duration applies to both)
- Separate enable/disable toggles for microbreak vs long break skip delay (single toggle controls both)
- Skip delay for "skip to next break" functionality (if different from regular skip)
- Analytics/tracking of how often users skip breaks or wait out delays
- Machine learning to adjust delay based on user patterns
- Audio cues when skip button becomes available
- Animated progress bar showing skip delay countdown (simple text countdown is sufficient for MVP)
- Administrator/enterprise policy to force minimum skip delay or prevent disabling (future consideration)
- Auto-enabling skip delay based on user skip frequency patterns

## Risks and Mitigations

**Risk**: Users may find forced delay frustrating and disable the feature or stop using Stretchly  
**Mitigation**: Default feature to disabled state (opt-in, not opt-out); make skip delay configurable with clear explanation of health benefits; reasonable 30-second default; allow complete disable via toggle

**Risk**: Users may not discover the enable/disable toggle  
**Mitigation**: Place toggle near other break-related settings; use descriptive label "Enforce delay before skipping breaks"; consider first-run tip or documentation highlighting optional nature

**Risk**: Visual countdown may be distracting during break  
**Mitigation**: Design subtle, non-intrusive countdown indicator; place it near skip button rather than center of screen (countdown is MANDATORY but can be styled for minimal distraction)

**Risk**: System sleep/resume may cause countdown issues  
**Mitigation**: Track countdown using wall-clock time (Date.now()) rather than setTimeout-based counters; recalculate on window focus/resume events

**Risk**: Feature may conflict with strict mode or other skip-prevention settings  
**Mitigation**: Document and test interaction between skip delay and strict mode; strict mode takes precedence (skip disabled entirely); when strict mode enabled, skip delay toggle is irrelevant

**Risk**: Internationalization of countdown timer and labels may be complex  
**Mitigation**: Use i18next with time formatting helpers; test with RTL languages; ensure countdown numbers don't require translation

## Dependencies

- Existing break window rendering code (microbreak.html, break.html, and associated renderers)
- electron-store for preferences persistence
- Existing preferences window UI (preferences.html)
- i18next for internationalized labels and help text
- Existing skip button implementation and event handlers
- Scheduler class or timing mechanisms already in use for breaks

## Success Validation

Feature will be considered successful when:

1. **Enable/Disable Works**: Users can toggle skip delay on/off in Preferences; when disabled, skip is immediately available (current behavior)
2. **Basic Functionality**: When enabled, skip button is disabled for configured delay period on both break types, then enables automatically
3. **Configuration Works**: Users can set delay from 1-300 seconds in Preferences when feature is enabled; setting persists across restarts
4. **Validation Enforced**: Users cannot set delay to 0 seconds when feature is enabled; validation error prevents invalid input
5. **Mandatory Countdown**: Visual countdown is ALWAYS displayed during delay period, updating at least once per second
6. **Input Dependency**: Duration input is disabled when feature is disabled, enabled when feature is enabled
7. **Edge Cases Handled**: System sleep/resume, strict mode interaction, feature disable during countdown, and delay > break duration all work correctly
8. **Cross-Platform**: Feature works identically on Windows, macOS, and Linux
9. **No Regressions**: Existing skip functionality, strict mode, and break scheduling continue to work as before when feature is disabled
10. **Passes Tests**: Unit tests verify enable/disable toggle, delay enforcement, countdown accuracy, validation rules, and preference persistence
