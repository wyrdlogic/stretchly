# Feature Specification: Strict Mode Skip Friction

**Feature Branch**: `002-strict-mode-password`  
**Created**: December 9, 2025  
**Updated**: December 10, 2025  
**Status**: Draft  
**Input**: User description: "Introduce friction to skipping breaks in strict mode by requiring users to type a randomly-generated complex string character-by-character with visual feedback, rather than preventing skips entirely"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Skip Friction Settings (Priority: P1)

A user can configure how much friction is introduced when attempting to skip breaks in strict mode. By default, strict mode requires typing a 20-character randomly-generated string to skip. Users can adjust the string length or disable the feature entirely, allowing them to balance discipline with flexibility for their specific needs.

**Why this priority**: Core configuration needed for the feature to exist. Without this, the friction mechanism cannot be customized.

**Independent Test**: Can be fully tested by navigating to preferences, locating skip friction settings under strict mode, adjusting the character length (e.g., from 20 to 10), enabling/disabling the feature, saving preferences, and verifying settings persist across application restarts.

**Acceptance Scenarios**:

1. **Given** strict mode is enabled, **When** user opens preferences, **Then** user sees option to enable skip friction (enabled by default)
2. **Given** skip friction is enabled, **When** user views the character length setting, **Then** default value shows 20 characters
3. **Given** skip friction is enabled, **When** user adjusts character length to a value between 1 and maximum allowed, **Then** new value is accepted and saved
4. **Given** skip friction is enabled, **When** user attempts to set character length to 0 or negative, **Then** validation error prevents saving
5. **Given** skip friction is enabled, **When** user disables the feature and saves, **Then** strict mode returns to default behavior (no skip allowed)
6. **Given** skip friction settings are configured, **When** user restarts application and opens preferences, **Then** previously saved settings are displayed correctly

---

### User Story 2 - Skip Break with Character-by-Character Typing (Priority: P2)

When a break appears in strict mode with skip friction enabled, a user experiencing an urgent situation can skip by carefully typing a randomly-generated complex string. The system displays each character of the target string and provides immediate visual feedback as the user types each character. This creates deliberate friction that discourages casual skipping while still allowing skips when truly needed.

**Why this priority**: Delivers the core user value of the friction mechanism. Depends on P1 for configuration.

**Independent Test**: Can be fully tested by enabling strict mode with skip friction, waiting for a break to trigger, attempting to skip, viewing the randomly-generated string, typing characters with correct/incorrect input, observing color feedback (green for correct, red for incorrect), and verifying skip button appears only when all characters are correct.

**Acceptance Scenarios**:

1. **Given** strict mode with skip friction is enabled and a break is active, **When** user attempts to skip the break, **Then** a new randomly-generated string is displayed above an input interface
2. **Given** skip friction interface is displayed, **When** user views the interface, **Then** target string is shown with each character in a separate column
3. **Given** user begins typing, **When** user enters correct character for current position, **Then** that column turns green and cursor advances to next position
4. **Given** user begins typing, **When** user enters incorrect character for current position, **Then** that column turns red but input remains (not cleared)
5. **Given** user has typed some characters, **When** user corrects an incorrect character, **Then** column changes from red to green
6. **Given** user is typing, **When** all characters are entered correctly, **Then** skip button becomes visible and active
7. **Given** skip button is visible, **When** user clicks skip button, **Then** break is skipped immediately

---

### User Story 3 - View and Reset Skip Counter (Priority: P3)

Users can view how many times they have skipped breaks in strict mode and reset this counter when desired. This provides awareness of skip behavior and allows users to track their adherence to break discipline over time.

**Why this priority**: Provides useful feedback mechanism but not critical for core friction functionality. Users can benefit from the friction feature without tracking skips.

**Independent Test**: Can be fully tested by viewing skip counter in preferences (initially showing 0), skipping a strict mode break using the friction interface, reopening preferences to verify counter incremented, resetting the counter, and verifying counter returns to 0 and persists across application restarts.

**Acceptance Scenarios**:

1. **Given** application is first installed or counter never used, **When** user views preferences, **Then** skip counter displays 0
2. **Given** user successfully skips a strict mode break using friction interface, **When** counter is incremented, **Then** new count is immediately persisted
3. **Given** user has skipped breaks multiple times, **When** user views preferences, **Then** skip counter displays total number of strict mode skips
4. **Given** skip counter shows a value greater than 0, **When** user clicks reset counter button, **Then** counter resets to 0 and persists
5. **Given** skip counter has been incremented, **When** user restarts application and views preferences, **Then** counter displays same value as before restart
6. **Given** user skips a break without friction enabled (friction disabled), **When** break is skipped, **Then** counter does not increment

---

### Edge Cases

- What happens when randomly-generated string contains visually similar characters (e.g., 0 vs O, 1 vs l vs I)? (All valid characters from the character set can appear; users must distinguish them carefully as part of the friction)
- What happens when user sets character length to maximum supported value? (System should handle up to a reasonable maximum like 100 characters without performance degradation)
- What happens when user sets character length to 1? (System generates and displays a single-character string; friction is minimal but feature still works)
- What happens when user types characters using copy-paste instead of typing? (Paste functionality should work - friction comes from difficulty of the complex string, not from preventing paste)
- What happens to skip counter when it reaches very large numbers? (Counter should support values up to reasonable maximum without overflow; exact limit determined by storage mechanism)
- What happens when user changes character length setting while a break with friction interface is already active? (Active break continues with its already-generated string; new setting applies to next break)
- What happens when theme changes while friction interface is displayed? (Color scheme for correct/incorrect feedback updates to match new theme immediately)

## Requirements *(mandatory)*

### Functional Requirements

**Configuration**:

- **FR-001**: System MUST provide option in preferences to enable skip friction for strict mode (enabled by default when strict mode is enabled)
- **FR-002**: System MUST allow users to configure character length for generated string with minimum value of 1
- **FR-003**: System MUST set default character length to 20 characters
- **FR-004**: System MUST validate that character length is a positive integer before saving
- **FR-005**: System MUST persist skip friction settings across application restarts
- **FR-006**: System MUST maintain separate skip friction settings for mini breaks and long breaks (consistent with existing microbreakStrictMode and breakStrictMode separation)

**String Generation**:

- **FR-007**: System MUST generate a new random string each time skip is attempted
- **FR-008**: System MUST include numbers (0-9) in random string generation
- **FR-009**: System MUST include lowercase letters (a-z) in random string generation
- **FR-010**: System MUST include uppercase letters (A-Z) in random string generation
- **FR-011**: System MUST include special characters in random string generation
- **FR-012**: System MUST generate string with length matching user's configured character length setting

**Visual Interface**:

- **FR-013**: System MUST display generated string above input interface with each character in a separate visual column
- **FR-014**: System MUST provide input mechanism for each character position
- **FR-015**: System MUST display user's entered character below the corresponding target character in the same column
- **FR-016**: System MUST show column as transparent when no character has been entered for that position
- **FR-017**: System MUST show column in green when correct character has been entered for that position
- **FR-018**: System MUST show column in red when incorrect character has been entered for that position

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can configure skip friction settings (enable/disable, character length) in under 30 seconds
- **SC-002**: Friction interface appears within 1 second of skip attempt in strict mode with skip friction enabled
- **SC-003**: Visual feedback (color change) appears within 100 milliseconds of each character entry
- **SC-004**: Users cannot skip break until 100% of characters are entered correctly
- **SC-005**: Each skip attempt generates a unique random string (no repeats across consecutive attempts)
- **SC-006**: Skip counter accurately reflects number of successful skips with 100% accuracy
- **SC-007**: Skip counter persists across application restarts without data loss
- **SC-008**: Users can change friction settings or reset counter without requiring application restart
- **SC-009**: Feature maintains existing strict mode skip prevention when skip friction is disabled (zero regression)
- **SC-010**: Interface remains responsive and usable with character lengths up to 100 characters
- **FR-025**: System MUST hide skip button until all characters are entered correctly
- **FR-026**: System MUST show skip button when all characters match target string
- **FR-027**: System MUST skip break immediately when user clicks skip button after completing string
- **FR-028**: System MUST allow user to cancel friction interface and continue break normally
- **FR-029**: System MUST preserve existing strict mode behavior (no skip allowed) when skip friction is disabled

**Skip Counter**:

- **FR-030**: System MUST maintain counter of successful strict mode break skips
- **FR-031**: System MUST increment counter only when break is skipped using friction interface
- **FR-032**: System MUST persist counter value across application restarts
- **FR-033**: System MUST display current counter value in preferences
- **FR-034**: System MUST provide mechanism to reset counter to 0
- **FR-035**: System MUST persist counter reset across application restarts
- **FR-036**: System MUST NOT increment counter when friction is disabled and break is skipped by other means

### Key Entities

- **Skip Friction Configuration**: User's settings for friction mechanism including enabled state and character length, stored in user preferences, separate for mini breaks and long breaks
- **Random String**: Newly generated complex string created each time skip is attempted, composed of numbers, lowercase, uppercase, and special characters matching configured length
- **Friction Interface**: Visual display showing target string in top row and user input in bottom row, with column-based layout and color-coded feedback
- **Skip Counter**: Persistent count of successful strict mode break skips using friction interface, stored in user preferences, displayable and resettable by user
