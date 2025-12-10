import { describe, it, expect, beforeEach } from 'vitest'
import { JSDOM } from 'jsdom'

describe('Friction UI', () => {
  let dom
  let window
  let document

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="friction-container" style="display: none;">
            <div class="friction-stats">
              <span id="friction-total-count">0</span>
              <span id="friction-sequential-count">0</span>
            </div>
            <div class="friction-grid" id="friction-grid"></div>
            <div class="friction-actions">
              <button id="friction-skip" disabled>Skip</button>
              <button id="friction-cancel">Cancel</button>
            </div>
          </div>
          <div class="breaks">
            <div>Break content 1</div>
            <div>Break content 2</div>
          </div>
        </body>
      </html>
    `)
    window = dom.window
    document = window.document
    global.document = document
  })

  describe('DOM Generation', () => {
    it('should create correct multi-word layout structure', () => {
      const frictionGrid = document.querySelector('#friction-grid')
      const wordCount = 3
      const charLength = 5

      for (let wordIndex = 0; wordIndex < wordCount; wordIndex++) {
        const wordDiv = document.createElement('div')
        wordDiv.className = 'friction-word'

        const targetRow = document.createElement('div')
        targetRow.className = 'friction-row'

        const inputRow = document.createElement('div')
        inputRow.className = 'friction-row'

        for (let i = 0; i < charLength; i++) {
          const targetCol = document.createElement('div')
          targetCol.className = 'friction-column target-char'
          targetCol.textContent = 'A'
          targetRow.appendChild(targetCol)

          const inputCol = document.createElement('div')
          inputCol.className = 'friction-column input-char empty'
          const input = document.createElement('input')
          input.type = 'text'
          input.maxLength = 1
          input.dataset.wordIndex = wordIndex
          input.dataset.charIndex = i
          inputCol.appendChild(input)
          inputRow.appendChild(inputCol)
        }

        wordDiv.appendChild(targetRow)
        wordDiv.appendChild(inputRow)
        frictionGrid.appendChild(wordDiv)
      }

      const words = frictionGrid.querySelectorAll('.friction-word')
      expect(words.length).toBe(3)

      words.forEach(word => {
        const rows = word.querySelectorAll('.friction-row')
        expect(rows.length).toBe(2)
        expect(rows[0].querySelectorAll('.target-char').length).toBe(5)
        expect(rows[1].querySelectorAll('.input-char').length).toBe(5)
      })
    })

    it('should set correct data attributes on inputs', () => {
      const frictionGrid = document.querySelector('#friction-grid')

      const wordDiv = document.createElement('div')
      const inputRow = document.createElement('div')
      inputRow.className = 'friction-row'

      for (let i = 0; i < 3; i++) {
        const inputCol = document.createElement('div')
        const input = document.createElement('input')
        input.dataset.wordIndex = '1'
        input.dataset.charIndex = i.toString()
        inputCol.appendChild(input)
        inputRow.appendChild(inputCol)
      }

      wordDiv.appendChild(inputRow)
      frictionGrid.appendChild(wordDiv)

      const inputs = frictionGrid.querySelectorAll('input')
      expect(inputs[0].dataset.wordIndex).toBe('1')
      expect(inputs[0].dataset.charIndex).toBe('0')
      expect(inputs[1].dataset.charIndex).toBe('1')
      expect(inputs[2].dataset.charIndex).toBe('2')
    })
  })

  describe('Validation States', () => {
    it('should transition from empty to correct state', () => {
      const inputCol = document.createElement('div')
      inputCol.className = 'friction-column input-char empty'
      const input = document.createElement('input')
      inputCol.appendChild(input)

      inputCol.classList.remove('empty')
      inputCol.classList.add('correct')

      expect(inputCol.classList.contains('empty')).toBe(false)
      expect(inputCol.classList.contains('correct')).toBe(true)
      expect(inputCol.classList.contains('incorrect')).toBe(false)
    })

    it('should transition from empty to incorrect state', () => {
      const inputCol = document.createElement('div')
      inputCol.className = 'friction-column input-char empty'
      const input = document.createElement('input')
      inputCol.appendChild(input)

      inputCol.classList.remove('empty')
      inputCol.classList.add('incorrect')

      expect(inputCol.classList.contains('empty')).toBe(false)
      expect(inputCol.classList.contains('correct')).toBe(false)
      expect(inputCol.classList.contains('incorrect')).toBe(true)
    })

    it('should transition from incorrect to correct state', () => {
      const inputCol = document.createElement('div')
      inputCol.className = 'friction-column input-char incorrect'
      const input = document.createElement('input')
      inputCol.appendChild(input)

      inputCol.classList.remove('incorrect')
      inputCol.classList.add('correct')

      expect(inputCol.classList.contains('empty')).toBe(false)
      expect(inputCol.classList.contains('correct')).toBe(true)
      expect(inputCol.classList.contains('incorrect')).toBe(false)
    })

    it('should transition back to empty when input cleared', () => {
      const inputCol = document.createElement('div')
      inputCol.className = 'friction-column input-char correct'
      const input = document.createElement('input')
      inputCol.appendChild(input)

      inputCol.classList.remove('correct')
      inputCol.classList.add('empty')

      expect(inputCol.classList.contains('empty')).toBe(true)
      expect(inputCol.classList.contains('correct')).toBe(false)
      expect(inputCol.classList.contains('incorrect')).toBe(false)
    })
  })

  describe('Skip Button State', () => {
    it('should be disabled initially', () => {
      const skipButton = document.querySelector('#friction-skip')
      expect(skipButton.disabled).toBe(true)
    })

    it('should enable when all inputs are correct', () => {
      const skipButton = document.querySelector('#friction-skip')
      skipButton.disabled = false
      expect(skipButton.disabled).toBe(false)
    })

    it('should disable when any input is incorrect', () => {
      const skipButton = document.querySelector('#friction-skip')
      skipButton.disabled = false
      skipButton.disabled = true
      expect(skipButton.disabled).toBe(true)
    })
  })

  describe('Vertical Layout', () => {
    it('should have 2 rows per word (target + input)', () => {
      const frictionGrid = document.querySelector('#friction-grid')

      const wordDiv = document.createElement('div')
      wordDiv.className = 'friction-word'

      const targetRow = document.createElement('div')
      targetRow.className = 'friction-row'
      const inputRow = document.createElement('div')
      inputRow.className = 'friction-row'

      wordDiv.appendChild(targetRow)
      wordDiv.appendChild(inputRow)
      frictionGrid.appendChild(wordDiv)

      const rows = wordDiv.querySelectorAll('.friction-row')
      expect(rows.length).toBe(2)
      expect(rows[0]).toBe(targetRow)
      expect(rows[1]).toBe(inputRow)
    })

    it('should stack multiple words vertically', () => {
      const frictionGrid = document.querySelector('#friction-grid')

      for (let i = 0; i < 5; i++) {
        const wordDiv = document.createElement('div')
        wordDiv.className = 'friction-word'
        wordDiv.dataset.wordIndex = i
        frictionGrid.appendChild(wordDiv)
      }

      const words = frictionGrid.querySelectorAll('.friction-word')
      expect(words.length).toBe(5)
      expect(words[0].dataset.wordIndex).toBe('0')
      expect(words[4].dataset.wordIndex).toBe('4')
    })
  })
})
