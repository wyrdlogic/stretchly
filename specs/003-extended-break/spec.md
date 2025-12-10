# Feature Specification: Extended Break Triggers

**Feature Branch**: `003-extended-break`  
**Created**: December 10, 2025  
**Status**: Draft  
**Input**: User description: "User can configure the break period to have a once-off increase based on specific triggers: time of day or consecutive break count"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Time-Based Extended Break (Priority: P1)

A user wants to ensure they take a proper lunch break daily. They configure the application so that the first break after 13:00 is extended to 30 minutes instead of the usual 5 minutes. This ensures they step away from their computer for a meaningful period without having to manually adjust settings each day.

**Why this priority**: This addresses the primary use case of enforcing a daily lunch break or exercise period, which is critical for user health and the core value proposition of this feature.

**Independent Test**: Can be fully tested by configuring a time-based trigger, observing that the first break after the specified time is extended, and verifying the duration returns to normal after completion. Delivers standalone value by ensuring users take at least one extended break per day.

**Acceptance Scenarios**:

1. **Given** a user has configured the first break after 13:00 to be 30 minutes, **When** a break triggers at 13:15, **Then** the system evaluates that this is the first break after 13:00 and applies the 30-minute duration override instead of the regular 5 minutes
2. **Given** a user has configured the first break after 13:00 to be 30 minutes, **When** the user completes the 30-minute break, **Then** subsequent breaks revert to the regular 5-minute duration
3. **Given** a user has configured the first break after 13:00 to be 30 minutes, **When** the user skips the 13:15 break, **Then** the next scheduled break is still 30 minutes
4. **Given** a user has configured the first break after 13:00 to be 30 minutes, **When** the computer has been idle for more than 30 minutes after 13:00, **Then** the extended break is skipped and the regular 5-minute duration applies
5. **Given** a user starts work at 13:45, **When** the first break triggers at 14:00, **Then** the break is the regular 5-minute duration because the idle time exceeded the extended break duration

---

### User Story 2 - Consecutive Break Count Trigger (Priority: P2)

A user wants to take a substantial break every few hours. They configure the application so that after every 4 consecutive breaks of 5 minutes, the 5th break is extended to 30 minutes. This creates a rhythm of regular short breaks with periodic longer breaks.

**Why this priority**: This provides an alternative triggering mechanism for users who prefer routine-based breaks rather than time-based ones, expanding the feature's usefulness.

**Independent Test**: Can be fully tested by configuring a consecutive break count trigger, completing the specified number of breaks, and verifying the extended break occurs. Delivers independent value for users who prefer count-based rhythms.

**Acceptance Scenarios**:

1. **Given** a user has configured every 5th break to be 30 minutes after 4 consecutive 5-minute breaks, **When** the user completes 4 breaks without skipping, **Then** the 5th break is 30 minutes
2. **Given** a user has configured every 5th break to be 30 minutes, **When** the user completes the 30-minute break, **Then** the counter resets and subsequent breaks are 5 minutes until the next cycle
3. **Given** a user has configured every 5th break to be 30 minutes, **When** the user skips the 5th break, **Then** the next break is still 30 minutes and the counter doesn't reset until completed
4. **Given** a user has configured every 5th break to be 30 minutes and has completed 2 breaks, **When** the computer is idle for more than 30 minutes, **Then** the counter resets to zero
5. **Given** a user has configured every 5th break to be 30 minutes and has completed 3 breaks, **When** the user skips one break in the sequence, **Then** the counter continues and the 5th total break is still extended

---

### User Story 3 - Configuration Management (Priority: P3)

A user wants to enable, disable, or modify extended break triggers without losing their settings. They can access preferences to configure time-based triggers, consecutive break triggers, or both simultaneously, and can adjust the extended break duration for each trigger independently.

**Why this priority**: This provides flexibility and control over the feature but is less critical than the core triggering functionality. Users need basic configuration to use the feature, but advanced configuration options can come later.

**Independent Test**: Can be fully tested by accessing preferences, configuring multiple triggers, saving settings, and verifying they persist across application restarts.

**Acceptance Scenarios**:

1. **Given** a user opens preferences, **When** they enable a time-based extended break trigger, **Then** they can specify the trigger time and extended duration
2. **Given** a user opens preferences, **When** they enable a consecutive break count trigger, **Then** they can specify the number of breaks and extended duration
3. **Given** a user has configured both a 20-minute time-based trigger and a 30-minute consecutive-count trigger, **When** a break triggers and both conditions are met, **Then** the system applies the longest duration (30 minutes) for that break
4. **Given** a user has saved extended break configurations, **When** they restart the application, **Then** all trigger settings are preserved
5. **Given** a user has an active extended break trigger, **When** they disable it in preferences, **Then** all breaks use the regular duration

---

### Edge Cases

- All identified edge cases have been clarified and incorporated into functional requirements

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to configure multiple time-based conditions, each overriding the break duration for the first break occurring after its specified time
- **FR-002**: System MUST allow users to configure a consecutive-break-count condition that overrides the long break duration after a specified number of consecutive long breaks (minimum 2, no maximum)
- **FR-003**: System MUST allow users to specify different extended durations for time-based and consecutive-count triggers independently without duration limits
- **FR-004**: System MUST carry over an extended break to the next scheduled break if the user skips the break when the trigger activates
- **FR-005**: System MUST clear a pending extended break only after the user completes the full extended duration
- **FR-006**: System MUST not apply a time-based duration override if the computer has been idle for longer than the configured extended duration after the specified time
- **FR-007**: System MUST reset the consecutive break counter to zero if the computer has been idle for longer than the configured extended duration between breaks
- **FR-008**: System MUST display break window with remaining time using extended duration, and show additional information indicating which trigger(s) activated (e.g., "Extended break - triggered by: Time (14:00)" or "Extended break - triggered by: Time (14:00), Consecutive breaks (5)" when multiple conditions met)
- **FR-009**: System MUST maintain the consecutive break counter when a break is skipped (not counting it as completion)
- **FR-010**: System MUST persist all extended break trigger configurations across application restarts
- **FR-011**: System MUST support both trigger types being enabled simultaneously
- **FR-012**: System MUST apply the longest extended break duration when multiple trigger conditions are met on the same break, and when multiple triggers have equal duration, all matching triggers apply and their information is shown in the break window
- **FR-013**: System MUST apply the longest duration when multiple time-based triggers are applicable to the same break
- **FR-014**: System MUST revert to the regular break duration after an extended break completes
- **FR-015**: System MUST count skipped breaks toward the consecutive break counter for the purpose of determining when the next extended break occurs
- **FR-016**: System MUST treat idle periods exceeding the extended duration as an implicit extended break that resets applicable triggers
- **FR-017**: System MUST apply extended break duration overrides only to long breaks, not to microbreaks
- **FR-018**: System MUST reset time-based triggers at midnight each day, making them eligible to trigger again
- **FR-019**: System MUST use system clock time for all time-based trigger evaluations, without special handling for system time changes
- **FR-020**: System MUST cancel an extended break and revert to regular duration if the computer goes to sleep during the extended break
- **FR-021**: System MUST apply configuration changes immediately to the next break calculation, with breaks currently in progress continuing with their original duration
- **FR-022**: System MUST implement error recovery when trigger data fails to load or parse (corrupt JSON, invalid UUID, malformed settings) by logging the error with details and treating trigger configuration as empty array for graceful degradation, allowing break scheduling to continue with default durations while users can reconfigure triggers through UI

### Key Entities

- **Extended Break Duration Override Configuration**: Represents a user-defined rule for extending break duration when conditions are met, including override type (time-based or count-based), activation parameters (time or count threshold), extended duration, and enabled/disabled state
- **Break Instance**: Represents a scheduled break occurrence with its duration (regular or extended), trigger source if extended, skip status, and completion status
- **Consecutive Break Counter**: Tracks the number of consecutive breaks completed since the last reset, used to determine when count-based triggers activate
- **Idle Period**: Represents a period of computer inactivity, including duration and timing, used to determine whether to skip extended breaks or reset counters

## Clarifications

### Session 2025-12-10

- Q: When users configure extended break durations, what constraints should apply? → A: No limits - users can set any duration
- Q: Can users configure multiple time-based triggers for different times of day (e.g., one at 13:00 for lunch, another at 16:00 for afternoon break)? → A: Multiple time-based triggers allowed (multiple extended breaks at different times)
- Q: When multiple time-based triggers could apply to the same break, which one should be used? → A: Longest duration among applicable triggers
- Q: For the consecutive break count trigger, what range of break counts should be allowed? → A: Minimum 2, no maximum
- Q: When a user modifies an extended break configuration while a trigger is pending, what should happen? → A: Apply new configuration immediately to pending break
- Q: Should the extended break duration override apply to both microbreaks and long breaks, or only to long breaks? → A: Long breaks only (microbreaks excluded)
- Q: When does a time-based trigger reset for the next day? → A: Reset at midnight (new calendar day)
- Q: When a user changes the system time backward or forward across a configured trigger time, how should the system respond? → A: Ignore time changes - triggers fire based on system clock regardless
- Q: When the computer goes to sleep during an extended break, should the break continue when the computer wakes up, or should it be canceled? → A: Cancel the break and revert to regular duration
- Q: When a user changes the regular break interval settings while an extended break is pending, what should happen to the pending extended break? → A: Keep extended break pending - interval change doesn't affect it

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can configure and activate a time-based extended break trigger within 1 minute
- **SC-002**: Users can configure and activate a consecutive-break-count trigger within 1 minute
- **SC-003**: Extended breaks trigger correctly with 100% accuracy when configured conditions are met
- **SC-004**: Extended break triggers are correctly skipped when idle duration exceeds the extended break duration
- **SC-005**: Break durations return to regular settings immediately after an extended break completes
- **SC-006**: All extended break configurations persist correctly across application restarts with no data loss
- **SC-007**: Users can complete a full daily cycle (start work, take breaks including extended break, finish work) with extended break triggers functioning as expected without manual intervention
