# UI Components Contract

**Feature**: Strict Mode Skip Friction  
**Component**: Friction Interface HTML/CSS Specification  
**Date**: December 10, 2025

## Overview

This contract defines the HTML structure, CSS styling, and JavaScript behavior for the friction interface displayed in break windows when users attempt to skip breaks in strict mode.

---

## Component Architecture

### Component Hierarchy

```
friction-container (root)
├── friction-stats (statistics display)
│   ├── total-count-label
│   └── sequential-count-label
├── friction-grid (character input area)
│   ├── friction-word (for each word)
│   │   ├── friction-column (for each character)
│   │   │   ├── target-char (top row)
│   │   │   └── input-char (bottom row, input element)
│   │   └── friction-column (repeat)
│   ├── word-spacer (between words)
│   └── friction-word (repeat for multi-word)
└── friction-actions (buttons)
    ├── friction-skip-btn
    └── friction-cancel-btn
```

---

## HTML Specification

### Base Structure (Single Word)

```html
<div id="friction-interface" class="friction-container">
  <!-- Statistics Display -->
  <div class="friction-stats">
    <span class="stat-item">
      <span class="stat-label" data-i18n="main.frictionStats"></span>
      <span id="friction-total-count" class="stat-value">0</span>
    </span>
    <span class="stat-item">
      <span class="stat-label" data-i18n="main.frictionSequential"></span>
      <span id="friction-sequential-count" class="stat-value">0</span>
    </span>
  </div>

  <!-- Character Input Grid -->
  <div class="friction-grid">
    <div class="friction-word">
      <!-- Generated dynamically for each character -->
      <div class="friction-column empty" data-index="0">
        <div class="target-char">A</div>
        <input type="text" 
               class="input-char" 
               maxlength="1" 
               autocomplete="off"
               spellcheck="false"
               data-index="0"
               aria-label="Character 1 of 20">
      </div>
      <!-- Repeat for each character in word -->
    </div>
  </div>

  <!-- Action Buttons -->
  <div class="friction-actions">
    <button id="friction-skip-btn" 
            class="friction-btn friction-btn-primary" 
            style="display: none;"
            data-i18n="main.frictionSkipButton">
      Skip Break
    </button>
    <button id="friction-cancel-btn" 
            class="friction-btn friction-btn-secondary"
            data-i18n="main.frictionCancelButton">
      Continue Break
    </button>
  </div>
</div>
```

### Multi-Word Structure (Incremental Friction)

```html
<!-- Words stacked vertically, each word = 2 rows (target + input) -->
<div class="friction-grid">
  <!-- Word 1: 2 rows -->
  <div class="friction-word">
    <!-- Row 1: Target characters for word 1 -->
    <div class="friction-row target-row">
      <div class="friction-column empty" data-index="0">
        <div class="target-char">A</div>
      </div>
      <div class="friction-column empty" data-index="1">
        <div class="target-char">3</div>
      </div>
      <!-- ... 18 more columns for 20-char word -->
    </div>
    
    <!-- Row 2: Input fields for word 1 -->
    <div class="friction-row input-row">
      <div class="friction-column empty" data-index="0">
        <input type="text" class="input-char" maxlength="1" data-index="0">
      </div>
      <div class="friction-column empty" data-index="1">
        <input type="text" class="input-char" maxlength="1" data-index="1">
      </div>
      <!-- ... 18 more input columns -->
    </div>
  </div>
  
  <div class="word-spacer"></div>
  
  <!-- Word 2: 2 rows -->
  <div class="friction-word">
    <!-- Row 1: Target characters for word 2 -->
    <div class="friction-row target-row">
      <div class="friction-column empty" data-index="20">
        <div class="target-char">F</div>
      </div>
      <!-- ... -->
    </div>
    
    <!-- Row 2: Input fields for word 2 -->
    <div class="friction-row input-row">
      <div class="friction-column empty" data-index="20">
        <input type="text" class="input-char" maxlength="1" data-index="20">
      </div>
      <!-- ... -->
    </div>
  </div>
  
  <!-- Repeat for additional words -->
</div>
```

---

## CSS Specification

### Layout Styles

```css
/* Container */
.friction-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* Statistics Display */
.friction-stats {
  display: flex;
  gap: 3rem;
  font-size: 1.2rem;
  color: var(--text-color);
}

.stat-item {
  display: flex;
  gap: 0.5rem;
}

.stat-label {
  font-weight: normal;
}

.stat-value {
  font-weight: bold;
  color: var(--accent-color);
}

/* Character Grid */
.friction-grid {
  display: flex;
  gap: 2rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.friction-word {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.friction-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, 3rem);
  gap: 0.5rem;
}

.target-row {
  /* First row of each word: target characters */
}

.input-row {
  /* Second row of each word: input fields */
}

.word-spacer {
  width: 100%;
  height: 1rem;
}

/* Character Column */
.friction-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.1s ease;
}

/* Column States */
.friction-column.empty {
  background-color: transparent;
  border: 2px dashed var(--border-color);
}

.friction-column.correct {
  background-color: var(--correct-green);
  border: 2px solid var(--correct-green-dark);
}

.friction-column.incorrect {
  background-color: var(--incorrect-red);
  border: 2px solid var(--incorrect-red-dark);
}

/* Target Character */
.target-char {
  font-family: 'Courier New', monospace;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-color);
  user-select: none;
}

/* Input Character */
.input-char {
  width: 2rem;
  height: 2rem;
  font-family: 'Courier New', monospace;
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  border: none;
  background: transparent;
  color: var(--input-text-color);
  outline: none;
  caret-color: var(--accent-color);
}

/* Action Buttons */
.friction-actions {
  display: flex;
  gap: 1rem;
}

.friction-btn {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.friction-btn:hover {
  transform: translateY(-2px);
}

.friction-btn:active {
  transform: translateY(0);
}

.friction-btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.friction-btn-primary:hover {
  background-color: var(--primary-color-dark);
}

.friction-btn-secondary {
  background-color: var(--secondary-color);
  color: var(--text-color);
}

.friction-btn-secondary:hover {
  background-color: var(--secondary-color-dark);
}
```

### Theme Colors (Add to color-scheme.css)

```css
:root {
  /* Friction Interface Colors (Light Theme) */
  --correct-green: #28a745;
  --correct-green-dark: #218838;
  --incorrect-red: #dc3545;
  --incorrect-red-dark: #c82333;
  --border-color: #d1d5db;
  --input-text-color: #1f2937;
}

[data-theme='dark'] {
  /* Friction Interface Colors (Dark Theme) */
  --correct-green: #3fb950;
  --correct-green-dark: #2ea043;
  --incorrect-red: #f85149;
  --incorrect-red-dark: #da3633;
  --border-color: #4b5563;
  --input-text-color: #e5e7eb;
}
```

### Responsive Design

```css
/* Tablet and smaller */
@media (max-width: 768px) {
  .friction-container {
    padding: 1rem;
    gap: 1.5rem;
  }
  
  .friction-stats {
    flex-direction: column;
    gap: 1rem;
    font-size: 1rem;
  }
  
  .friction-word {
    grid-template-columns: repeat(auto-fit, 2.5rem);
    gap: 0.25rem;
  }
  
  .friction-column {
    padding: 0.5rem 0.25rem;
  }
  
  .target-char,
  .input-char {
    font-size: 1.25rem;
  }
  
  .input-char {
    width: 1.75rem;
    height: 1.75rem;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .friction-word {
    grid-template-columns: repeat(auto-fit, 2rem);
  }
  
  .friction-column {
    padding: 0.25rem;
  }
  
  .target-char,
  .input-char {
    font-size: 1rem;
  }
  
  .input-char {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  .friction-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .friction-btn {
    width: 100%;
  }
}
```

---

## JavaScript Behavior

### Dynamic Generation

```javascript
function generateFrictionUI (targetStrings, totalCount, sequentialCount) {
  const container = document.getElementById('friction-interface')
  
  // Update statistics
  document.getElementById('friction-total-count').textContent = totalCount
  document.getElementById('friction-sequential-count').textContent = sequentialCount
  
  // Generate grid
  const grid = container.querySelector('.friction-grid')
  grid.innerHTML = ''
  
  let globalIndex = 0
  const totalLength = targetStrings.reduce((sum, word) => sum + word.length, 0)
  
  targetStrings.forEach((word, wordIndex) => {
    const wordContainer = document.createElement('div')
    wordContainer.className = 'friction-word'
    
    // Row 1: Target characters
    const targetRow = document.createElement('div')
    targetRow.className = 'friction-row target-row'
    
    // Row 2: Input fields
    const inputRow = document.createElement('div')
    inputRow.className = 'friction-row input-row'
    
    for (let i = 0; i < word.length; i++) {
      // Create target column
      const targetColumn = document.createElement('div')
      targetColumn.className = 'friction-column empty'
      targetColumn.dataset.index = globalIndex
      
      const targetChar = document.createElement('div')
      targetChar.className = 'target-char'
      targetChar.textContent = word[i]
      targetColumn.appendChild(targetChar)
      targetRow.appendChild(targetColumn)
      
      // Create input column
      const inputColumn = document.createElement('div')
      inputColumn.className = 'friction-column empty'
      inputColumn.dataset.index = globalIndex
      
      const inputChar = document.createElement('input')
      inputChar.type = 'text'
      inputChar.className = 'input-char'
      inputChar.maxLength = 1
      inputChar.autocomplete = 'off'
      inputChar.spellcheck = false
      inputChar.dataset.index = globalIndex
      inputChar.setAttribute('aria-label', `Character ${globalIndex + 1} of ${totalLength}`)
      inputColumn.appendChild(inputChar)
      inputRow.appendChild(inputColumn)
      
      globalIndex++
    }
    
    wordContainer.appendChild(targetRow)
    wordContainer.appendChild(inputRow)
    grid.appendChild(wordContainer)
    
    // Add spacer between words (except after last word)
    if (wordIndex < targetStrings.length - 1) {
      const spacer = document.createElement('div')
      spacer.className = 'word-spacer'
      grid.appendChild(spacer)
    }
  })
}
```

### Input Validation

```javascript
function setupFrictionValidation(targetStrings) {
  const flatTarget = targetStrings.join('') // Concatenate all words
  const validationState = new Array(flatTarget.length).fill(false)
  
  const inputs = document.querySelectorAll('.input-char')
  const skipButton = document.getElementById('friction-skip-btn')
  
  inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const column = e.target.closest('.friction-column')
      const enteredChar = e.target.value
      const targetChar = flatTarget[index]
      
      // Validate character
      const isCorrect = enteredChar === targetChar
      validationState[index] = isCorrect
      
      // Update column state
      column.classList.remove('empty', 'correct', 'incorrect')
      if (enteredChar === '') {
        column.classList.add('empty')
        validationState[index] = false
      } else if (isCorrect) {
        column.classList.add('correct')
      } else {
        column.classList.add('incorrect')
      }
      
      // Toggle skip button visibility
      const allCorrect = validationState.every(v => v === true)
      skipButton.style.display = allCorrect ? 'block' : 'none'
      
      // Auto-focus next input if correct
      if (isCorrect && index < inputs.length - 1) {
        inputs[index + 1].focus()
      }
    })
    
    // Allow backspace to focus previous input
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
        inputs[index - 1].focus()
      }
    })
  })
  
  // Focus first input on load
  if (inputs.length > 0) {
    inputs[0].focus()
  }
}
```

### Button Handlers

```javascript
function setupFrictionActions(onSkip, onCancel) {
  const skipButton = document.getElementById('friction-skip-btn')
  const cancelButton = document.getElementById('friction-cancel-btn')
  
  skipButton.addEventListener('click', async () => {
    skipButton.disabled = true
    await onSkip()
  })
  
  cancelButton.addEventListener('click', async () => {
    cancelButton.disabled = true
    await onCancel()
  })
}
```

---

## Integration with Break Windows

### Injection Point (break.html / microbreak.html)

Insert friction interface HTML into existing break window layout:

```html
<!-- Existing break window content -->
<div id="break-content">
  <div id="break-timer">...</div>
  <div id="break-message">...</div>
  
  <!-- NEW: Friction Interface (hidden by default) -->
  <div id="friction-interface" class="friction-container" style="display: none;">
    <!-- Friction UI injected here -->
  </div>
  
  <!-- Existing buttons -->
  <div id="break-buttons">
    <button id="postpone-btn">Postpone</button>
    <button id="skip-btn">Skip</button>
  </div>
</div>
```

### Show/Hide Logic (break-renderer.js)

```javascript
async function handleSkipAttempt() {
  const strictMode = await window.settings.get('breakStrictMode')
  const frictionEnabled = await window.settings.get('breakSkipFrictionEnabled')
  
  if (strictMode && frictionEnabled) {
    // Hide default buttons
    document.getElementById('break-buttons').style.display = 'none'
    
    // Show friction interface
    const frictionUI = document.getElementById('friction-interface')
    frictionUI.style.display = 'flex'
    
    // Generate friction UI
    const targetStrings = await generateTargetStrings()
    const totalCount = await window.settings.get('breakSkipFrictionTotalCount')
    const sequentialCount = await window.settings.get('breakSkipFrictionSequentialCount')
    
    generateFrictionUI(targetStrings, totalCount, sequentialCount)
    setupFrictionValidation(targetStrings)
    setupFrictionActions(
      async () => await handleFrictionSkip(),
      async () => await handleFrictionCancel()
    )
  } else {
    // Normal skip logic (existing behavior)
    await skipBreak()
  }
}
```

---

## Accessibility

### Keyboard Navigation

- **Tab**: Navigate between input fields
- **Backspace**: Clear current field and move to previous
- **Enter** (on skip button): Skip break
- **Escape**: Cancel friction interface (continue break)

### Screen Reader Support

```html
<!-- Add to friction-container -->
<div role="region" aria-label="Skip friction interface">
  <div class="friction-stats" aria-live="polite">...</div>
  <div class="friction-grid" role="group" aria-label="Character input grid">...</div>
</div>
```

### Focus Management

- On interface load: Focus first input field
- On character correct: Auto-focus next field
- On all correct: Focus skip button
- On cancel: Return focus to break window

---

## Performance Requirements

### Rendering Targets (SC-002, SC-003, SC-010)

- **Initial render**: <1 second for up to 100 characters (5 words × 20 chars)
- **Visual feedback**: <100ms per keystroke (CSS transition)
- **Button toggle**: <50ms when all characters correct

### DOM Size Estimation

```
Single word (20 chars):
  - 20 columns × 2 elements (target + input) = 40 elements
  
Maximum (5 words × 20 chars):
  - 100 columns × 2 elements = 200 elements
  - 4 word spacers
  - Total: ~210 DOM elements (acceptable)
```

---

## Testing Contract

### Visual Tests

```javascript
describe('Friction UI Rendering', () => {
  it('should render correct number of columns for single word', () => {
    generateFrictionUI(['A3!xB9@m'], 0, 0)
    const columns = document.querySelectorAll('.friction-column')
    expect(columns).toHaveLength(8)
  })
  
  it('should render multiple words with spacers', () => {
    generateFrictionUI(['AAAA', 'BBBB'], 0, 0)
    const words = document.querySelectorAll('.friction-word')
    const spacers = document.querySelectorAll('.word-spacer')
    expect(words).toHaveLength(2)
    expect(spacers).toHaveLength(1)
  })
})
```

### Interaction Tests

```javascript
describe('Friction UI Validation', () => {
  it('should mark column correct on matching input', () => {
    setupFrictionValidation(['A'])
    const input = document.querySelector('.input-char')
    input.value = 'A'
    input.dispatchEvent(new Event('input'))
    
    const column = input.closest('.friction-column')
    expect(column.classList.contains('correct')).toBe(true)
  })
  
  it('should show skip button when all correct', () => {
    setupFrictionValidation(['AB'])
    const inputs = document.querySelectorAll('.input-char')
    
    inputs[0].value = 'A'
    inputs[0].dispatchEvent(new Event('input'))
    inputs[1].value = 'B'
    inputs[1].dispatchEvent(new Event('input'))
    
    const skipButton = document.getElementById('friction-skip-btn')
    expect(skipButton.style.display).toBe('block')
  })
})
```

---

## Summary

- **3 main components**: Stats display, character grid, action buttons
- **3 column states**: Empty (transparent), correct (green), incorrect (red)
- **Dynamic generation**: Supports 1-5 words with 1-100 chars each
- **Responsive design**: Adapts to mobile, tablet, desktop
- **Accessibility**: Keyboard navigation, ARIA labels, focus management
- **Performance**: <1s render, <100ms feedback (meets SC-002, SC-003)
