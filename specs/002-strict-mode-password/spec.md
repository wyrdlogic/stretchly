# Feature Specification: Strict Mode Skip Friction

**Feature Branch**: `002-strict-mode-password`  
**Created**: December 9, 2025  
**Updated**: December 10, 2025  
**Status**: Draft  
**Input**: User description: "Introduce friction to skipping breaks in strict mode by requiring users to type a randomly-generated complex string character-by-character with visual feedback. Include incremental friction that increases the number of words required based on sequential skips, tracked separately for mini and long breaks."

## Clarifications

### Session 2025-12-10

- Q: When incremental friction is enabled, the spec mentions generating "words" (FR-017, FR-018) but the character-by-character interface describes individual characters in columns. How should words relate to the character interface? → A: Each word is a separate sequence of characters with visual spacing between words, displayed in the same column-based interface
- Q: What specific special characters should be included in the random string generation (FR-015)? → A: Common keyboard special characters: `!@#$%^&*()_+-=[]{}|;:,.<>?`
- Q: When incremental friction is enabled, what is the character length of each "word" in the generated sequence? → A: Use the configured character length setting (default 20) per word
- Q: When displaying multiple words with incremental friction, should words be arranged horizontally or vertically? → A: Each word occupies 2 rows stacked vertically (row 1: target characters, row 2: input fields), with words separated by vertical spacing. For 3 words, the layout is: word1-target (row 1), word1-input (row 2), spacing, word2-target (row 3), word2-input (row 4), spacing, word3-target (row 5), word3-input (row 6)

---

**Clarification Summary**: All ambiguities resolved. Incremental friction displays words as vertically-stacked 2-row pairs (target + input), providing clear visual separation and better mobile/responsive support.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Skip Friction Settings (Priority: P1)

A user can configure how much friction is introduced when attempting to skip breaks in strict mode. By default, strict mode requires typing a 20-character randomly-generated string to skip. Users can adjust the string length, enable incremental friction that increases difficulty with sequential skips, or disable the feature entirely, allowing them to balance discipline with flexibility for their specific needs.

**Why this priority**: Core configuration needed for the feature to exist. Without this, the friction mechanism cannot be customized.

**Independent Test**: Can be fully tested by navigating to preferences, locating skip friction settings under strict mode, adjusting the character length (e.g., from 20 to 10), enabling/disabling incremental friction, configuring maximum words for incremental friction, saving preferences, and verifying settings persist across application restarts.

**Acceptance Scenarios**:

1. **Given** strict mode is enabled, **When** user opens preferences, **Then** user sees option to enable skip friction (enabled by default)
2. **Given** skip friction is enabled, **When** user views the character length setting, **Then** default value shows 20 characters
3. **Given** skip friction is enabled, **When** user adjusts character length to a value between 1 and maximum allowed, **Then** new value is accepted and saved
4. **Given** skip friction is enabled, **When** user attempts to set character length to 0 or negative, **Then** validation error prevents saving
5. **Given** skip friction is enabled, **When** user views incremental friction option, **Then** it is enabled by default
6. **Given** incremental friction is enabled, **When** user views maximum words setting, **Then** default value shows 5 words
7. **Given** incremental friction is enabled, **When** user adjusts maximum words to a positive integer, **Then** new value is accepted and saved
8. **Given** incremental friction is enabled, **When** user disables it and saves, **Then** friction reverts to fixed character length behavior
9. **Given** skip friction is enabled, **When** user disables the feature and saves, **Then** strict mode returns to default behavior (no skip allowed)
10. **Given** skip friction settings are configured, **When** user restarts application and opens preferences, **Then** previously saved settings are displayed correctly

---

### User Story 2 - Skip Break with Character-by-Character Typing (Priority: P2)

When a break appears in strict mode with skip friction enabled, a user experiencing an urgent situation can skip by carefully typing a randomly-generated complex string. The system displays each character of the target string and provides immediate visual feedback as the user types each character. With incremental friction enabled, the number of words increases based on sequential skips, making it progressively harder to skip repeatedly. This creates deliberate friction that discourages casual skipping while still allowing skips when truly needed.

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
8. **Given** incremental friction is enabled and this is the first sequential skip, **When** friction interface appears, **Then** 1 word is displayed
9. **Given** incremental friction is enabled and user has skipped 2 breaks sequentially, **When** friction interface appears for third skip, **Then** 3 words are displayed
10. **Given** incremental friction is enabled with maximum of 5 words and user has skipped 10 breaks sequentially, **When** friction interface appears, **Then** 5 words are displayed (capped at maximum)
11. **Given** incremental friction is enabled and user has skipped breaks sequentially, **When** user does not skip a break (break completes normally), **Then** sequential skip counter resets to 0

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

### User Story 4 - View Skip Statistics During Friction (Priority: P3)

When the friction interface is displayed during a skip attempt, users can see both their total skip count and current sequential skip count. This provides immediate feedback about their skip behavior and helps them understand why the difficulty is increasing with incremental friction enabled.

**Why this priority**: Enhances transparency and user awareness but not critical for core functionality. Users can skip breaks without seeing these statistics.

**Independent Test**: Can be fully tested by enabling friction with incremental friction, skipping breaks multiple times, and verifying that both total skip count and sequential skip count are displayed on the friction interface and update correctly for each break type (mini and long breaks tracked separately).

**Acceptance Scenarios**:

1. **Given** friction interface is displayed for a skip attempt, **When** user views the interface, **Then** total skip count for this break type is displayed
2. **Given** friction interface is displayed for a skip attempt, **When** user views the interface, **Then** current sequential skip count for this break type is displayed
3. **Given** user has skipped 5 mini breaks total with 2 sequential skips, **When** friction interface appears for mini break, **Then** displays show "Total: 5" and "Sequential: 2"
4. **Given** user has separate skip counts for mini and long breaks, **When** friction interface appears for mini break, **Then** only mini break statistics are shown (not long break statistics)
5. **Given** user successfully completes a break without skipping, **When** next friction interface appears for same break type, **Then** sequential count shows as 1 (reset occurred)
6. **Given** user skips a break, **When** friction interface appears for next break of same type, **Then** total count increments by 1 and sequential count increments by 1

---

### Edge Cases

- What happens when randomly-generated string contains visually similar characters (e.g., 0 vs O, 1 vs l vs I)? (All valid characters from the character set can appear; users must distinguish them carefully as part of the friction)
- What happens when user sets character length to maximum supported value? (System should handle up to a reasonable maximum like 100 characters without performance degradation)
- What happens when user sets character length to 1? (System generates and displays a single-character string; friction is minimal but feature still works)
- What happens when user types characters using copy-paste instead of typing? (Paste functionality should work - friction comes from difficulty of the complex string, not from preventing paste)
- What happens to skip counters when they reach very large numbers? (Counters should support values up to reasonable maximum without overflow; exact limit determined by storage mechanism)
- What happens when user changes character length setting while a break with friction interface is already active? (Active break continues with its already-generated string; new setting applies to next break)
- What happens when theme changes while friction interface is displayed? (Color scheme for correct/incorrect feedback updates to match new theme immediately)
- What happens when incremental friction is enabled and user sets maximum words to a very high number? (System should handle reasonable maximums like 50 words without performance issues)
- What happens when user enables incremental friction after already having sequential skips tracked? (Incremental friction applies immediately using current sequential skip count)
- What happens when user disables incremental friction while at a high sequential skip count? (Sequential counter continues tracking but word count reverts to fixed length; counter still resets when break not skipped)
- What happens when user switches between mini and long breaks? (Each break type maintains independent total and sequential counters)
- What happens when user completes a mini break after skipping long breaks? (Only long break sequential counter resets; mini break counter unaffected)
- What happens to sequential skip count when application restarts? (Sequential skip count persists across restarts for accurate tracking)

## Requirements *(mandatory)*

### Functional Requirements

**Configuration**:

- **FR-001**: System MUST provide option in preferences to enable skip friction for strict mode (enabled by default when strict mode is enabled)
- **FR-002**: System MUST allow users to configure character length for generated string with minimum value of 1
- **FR-003**: System MUST set default character length to 20 characters
- **FR-004**: System MUST validate that character length is a positive integer before saving
- **FR-005**: System MUST persist skip friction settings across application restarts
- **FR-006**: System MUST maintain separate skip friction settings for mini breaks and long breaks (consistent with existing microbreakStrictMode and breakStrictMode separation)
- **FR-007**: System MUST provide option in preferences to enable incremental friction (enabled by default)
- **FR-008**: System MUST allow users to configure maximum number of words for incremental friction
- **FR-009**: System MUST set default maximum words to 5
- **FR-010**: System MUST validate that maximum words is a positive integer before saving

**String Generation**:

- **FR-011**: System MUST generate a new random string each time skip is attempted
- **FR-012**: System MUST include numbers (0-9) in random string generation
- **FR-013**: System MUST include lowercase letters (a-z) in random string generation
- **FR-014**: System MUST include uppercase letters (A-Z) in random string generation
- **FR-015**: System MUST include special characters `!@#$%^&*()_+-=[]{}|;:,.<>?` in random string generation
- **FR-016**: System MUST generate string with length matching user's configured character length setting when incremental friction is disabled
- **FR-017**: System MUST generate number of words based on formula (1 + sequential skip count) when incremental friction is enabled, where each word is a separate character sequence of length equal to configured character length setting
- **FR-018**: System MUST cap number of words at configured maximum when incremental friction is enabled
- **FR-019**: System MUST continue incrementing sequential skip count even when word count is at maximum

**Visual Interface**:

- **FR-020**: System MUST display generated string above input interface with each character in a separate visual column, with visual spacing between words when incremental friction generates multiple words
- **FR-021**: System MUST provide input mechanism for each character position
- **FR-022**: System MUST display user's entered character below the corresponding target character in the same column
- **FR-023**: System MUST show column as transparent when no character has been entered for that position
- **FR-024**: System MUST show column in green when correct character has been entered for that position
- **FR-025**: System MUST show column in red when incorrect character has been entered for that position
- **FR-026**: System MUST display total skip count for current break type on friction interface
- **FR-027**: System MUST display sequential skip count for current break type on friction interface
- **FR-028**: System MUST update displayed counts to reflect separate tracking for mini breaks and long breaks
- **FR-029**: System MUST extend application theming to support correct (green), incorrect (red), and empty (transparent) states

**Input Validation**:

- **FR-030**: System MUST allow user to enter characters for each position without clearing on incorrect entry
- **FR-031**: System MUST allow user to correct previously entered characters
- **FR-032**: System MUST validate each character against corresponding position in target string
- **FR-033**: System MUST track completion state across all character positions

**Skip Behavior**:

- **FR-034**: System MUST hide skip button until all characters are entered correctly
- **FR-035**: System MUST show skip button when all characters match target string
- **FR-036**: System MUST skip break immediately when user clicks skip button after completing string
- **FR-037**: System MUST allow user to cancel friction interface and continue break normally
- **FR-038**: System MUST preserve existing strict mode behavior (no skip allowed) when skip friction is disabled

**Skip Counter and Tracking**:

- **FR-039**: System MUST maintain total counter of successful strict mode break skips for each break type (mini and long)
- **FR-040**: System MUST maintain sequential skip counter for each break type (mini and long)
- **FR-041**: System MUST increment total counter only when break is skipped using friction interface
- **FR-042**: System MUST increment sequential counter when break is skipped using friction interface
- **FR-043**: System MUST reset sequential counter to 0 when break completes without being skipped
- **FR-044**: System MUST persist total counter values across application restarts
- **FR-045**: System MUST persist sequential counter values across application restarts
- **FR-046**: System MUST display current total counter value in preferences for each break type
- **FR-047**: System MUST provide mechanism to reset total counter to 0 for each break type
- **FR-048**: System MUST persist total counter reset across application restarts
- **FR-049**: System MUST NOT increment counters when friction is disabled and break is skipped by other means
- **FR-050**: System MUST track mini break and long break counters independently
- **FR-051**: System MUST NOT reset sequential counter when application restarts

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can configure skip friction settings (enable/disable, character length, incremental friction, maximum words) in under 30 seconds
- **SC-002**: Friction interface appears within 1 second of skip attempt in strict mode with skip friction enabled
- **SC-003**: Visual feedback (color change) appears within 100 milliseconds of each character entry
- **SC-004**: Users cannot skip break until 100% of characters are entered correctly
- **SC-005**: Each skip attempt generates a unique random string (no repeats across consecutive attempts)
- **SC-006**: Skip counters (total and sequential) accurately reflect number of successful skips with 100% accuracy
- **SC-007**: Skip counters persist across application restarts without data loss
- **SC-008**: Users can change friction settings or reset counter without requiring application restart
- **SC-009**: Feature maintains existing strict mode skip prevention when skip friction is disabled (zero regression)
- **SC-010**: Interface remains responsive and usable with character lengths up to 100 characters
- **SC-011**: Incremental friction increases word count correctly following formula (1 + sequential count) up to maximum
- **SC-012**: Sequential skip counter resets to 0 within 1 second of break completing without skip
- **SC-013**: Mini break and long break counters remain independent with 100% accuracy
- **SC-014**: Statistics displayed on friction interface update in real-time with 100% accuracy

### Key Entities

- **Skip Friction Configuration**: User's settings for friction mechanism including enabled state, character length, incremental friction enabled state, and maximum words for incremental friction, stored in user preferences, separate for mini breaks and long breaks
- **Random String**: Newly generated complex string created each time skip is attempted, composed of numbers (0-9), lowercase letters (a-z), uppercase letters (A-Z), and special characters (`!@#$%^&*()_+-=[]{}|;:,.<>?`) with length determined by character length setting (default 20) when incremental friction is disabled, or multiple words (each of configured character length) separated by visual spacing when incremental friction is enabled
- **Friction Interface**: Visual display showing target string in top row and user input in bottom row, with column-based layout, color-coded feedback, and statistics display showing total and sequential skip counts for current break type
- **Total Skip Counter**: Persistent count of successful strict mode break skips using friction interface, tracked separately for mini breaks and long breaks, stored in user preferences, displayable and resettable by user
- **Sequential Skip Counter**: Persistent count of consecutive skips for each break type, tracked separately for mini breaks and long breaks, resets to 0 when break completes without skip, used to calculate word count for incremental friction, stored in user preferences
