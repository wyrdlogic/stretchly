import HtmlTranslate from './utils/htmlTranslate.js'
import './platform.js'
import { generateFrictionStrings } from './utils/frictionGenerator.js'

window.onload = async (event) => {
  const [idea, started, duration, strictMode, postpone,
    postponePercent, backgroundColor] = await window.breaks.sendBreakData()

  new HtmlTranslate(document).translate()

  document.ondragover = event =>
    event.preventDefault()

  document.ondrop = event =>
    event.preventDefault()

  const frictionEnabled = strictMode && await window.settings.get('microbreakSkipFrictionEnabled')
  let frictionActive = false
  let targetStrings = []

  const showFrictionInterface = async () => {
    frictionActive = true
    console.log('showFrictionInterface: Making window focusable')
    window.breaks.setWindowFocusable(true)

    const charLength = await window.settings.get('microbreakSkipFrictionCharLength')
    const incrementalEnabled = await window.settings.get('microbreakSkipFrictionIncrementalEnabled')
    const maxWords = await window.settings.get('microbreakSkipFrictionMaxWords')
    const sequentialCount = await window.settings.get('microbreakSkipFrictionSequentialCount')
    const totalCount = await window.settings.get('microbreakSkipFrictionTotalCount')

    targetStrings = generateFrictionStrings(charLength, sequentialCount, maxWords, incrementalEnabled)

    const frictionContainer = document.querySelector('#friction-container')
    const frictionGrid = document.querySelector('#friction-grid')
    frictionGrid.innerHTML = ''

    document.querySelector('#friction-total-count').textContent = 'Total skips: ' + totalCount
    document.querySelector('#friction-sequential-count').textContent = 'Sequential: ' + sequentialCount

    targetStrings.forEach((targetString, wordIndex) => {
      const wordDiv = document.createElement('div')
      wordDiv.className = 'friction-word'

      const targetRow = document.createElement('div')
      targetRow.className = 'friction-row'

      const inputRow = document.createElement('div')
      inputRow.className = 'friction-row'

      for (let i = 0; i < targetString.length; i++) {
        const targetCol = document.createElement('div')
        targetCol.className = 'friction-column target-char'
        targetCol.textContent = targetString[i]
        targetRow.appendChild(targetCol)

        const inputCol = document.createElement('div')
        inputCol.className = 'friction-column input-char empty'
        inputCol.dataset.wordIndex = wordIndex
        inputCol.dataset.charIndex = i

        const input = document.createElement('input')
        input.type = 'text'
        input.maxLength = 1
        input.autocomplete = 'off'
        input.spellcheck = false
        input.placeholder = '_'
        input.tabIndex = 0
        input.dataset.wordIndex = wordIndex
        input.dataset.charIndex = i

        input.addEventListener('input', (e) => {
          const enteredChar = e.target.value
          const expectedChar = targetStrings[wordIndex][i]

          if (enteredChar === expectedChar) {
            inputCol.classList.remove('empty', 'incorrect')
            inputCol.classList.add('correct')

            const nextInput = document.querySelector(`input[data-word-index="${wordIndex}"][data-char-index="${i + 1}"]`)
            if (nextInput) {
              nextInput.focus()
            } else if (wordIndex < targetStrings.length - 1) {
              const nextWordInput = document.querySelector(`input[data-word-index="${wordIndex + 1}"][data-char-index="0"]`)
              if (nextWordInput) nextWordInput.focus()
            }
          } else if (enteredChar) {
            inputCol.classList.remove('empty', 'correct')
            inputCol.classList.add('incorrect')
          } else {
            inputCol.classList.remove('correct', 'incorrect')
            inputCol.classList.add('empty')
          }

          checkAllCorrect()
        })

        input.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && !e.target.value) {
            const prevInput = document.querySelector(`input[data-word-index="${wordIndex}"][data-char-index="${i - 1}"]`)
            if (prevInput) {
              prevInput.focus()
            } else if (wordIndex > 0) {
              const prevWordLastChar = targetStrings[wordIndex - 1].length - 1
              const prevWordInput = document.querySelector(`input[data-word-index="${wordIndex - 1}"][data-char-index="${prevWordLastChar}"]`)
              if (prevWordInput) prevWordInput.focus()
            }
          }
        })

        inputCol.addEventListener('click', () => {
          input.focus()
        })

        inputCol.appendChild(input)
        inputRow.appendChild(inputCol)
      }

      wordDiv.appendChild(targetRow)
      wordDiv.appendChild(inputRow)
      frictionGrid.appendChild(wordDiv)
    })

    const checkAllCorrect = () => {
      const allInputs = frictionGrid.querySelectorAll('input')
      let allCorrect = true

      allInputs.forEach(input => {
        const wordIndex = parseInt(input.dataset.wordIndex)
        const charIndex = parseInt(input.dataset.charIndex)
        if (input.value !== targetStrings[wordIndex][charIndex]) {
          allCorrect = false
        }
      })

      document.querySelector('#friction-skip').disabled = !allCorrect
    }

    document.querySelector('.breaks > :nth-child(1)').classList.add('hidden')
    document.querySelector('.breaks > :nth-child(2)').classList.add('hidden')
    frictionContainer.classList.remove('hidden')

    setTimeout(() => {
      const firstInput = document.querySelector('input[data-word-index="0"][data-char-index="0"]')
      console.log('Attempting to focus first input:', firstInput)
      if (firstInput) {
        firstInput.focus()
        firstInput.click()
        console.log('Focused input, activeElement is:', document.activeElement)
      }
    }, 200)
  }

  document.querySelector('#close').onclick = async event => {
    if (frictionEnabled && !frictionActive) {
      showFrictionInterface()
    } else if (!frictionEnabled) {
      await window.settings.saveSettings('microbreakSkipFrictionSequentialCount', 0)
      await window.breaks.finishBreak()
    }
  }

  document.querySelector('#friction-skip').onclick = async () => {
    await window.settings.saveSettings('microbreakSkipFrictionTotalCount',
      (await window.settings.get('microbreakSkipFrictionTotalCount')) + 1)
    await window.settings.saveSettings('microbreakSkipFrictionSequentialCount',
      (await window.settings.get('microbreakSkipFrictionSequentialCount')) + 1)
    await window.breaks.finishBreak()
  }

  document.querySelector('#friction-cancel').onclick = async () => {
    frictionActive = false
    window.breaks.setWindowFocusable(false)
    document.querySelector('#friction-container').classList.add('hidden')
    document.querySelector('.breaks > :nth-child(1)').classList.remove('hidden')
    document.querySelector('.breaks > :nth-child(2)').classList.remove('hidden')
  }

  document.querySelector('#postpone').onclick = async event =>
    await window.breaks.postponeBreak()

  document.querySelector('.microbreak-idea').innerHTML = window.breaks.sanitizeIdea(idea)

  document.querySelectorAll('.microbreak-idea a').forEach(a => {
    a.onclick = (event) => {
      event.preventDefault()
      window.electronApi.openExternal(a.href)
    }
  })

  document.querySelectorAll('.microbreak-idea img').forEach(async img => {
    const src = img.getAttribute('src') || ''
    const resolved = await window.electronApi.resolveLocalImage(src)
    if (resolved) {
      img.src = resolved
    } else {
      img.remove()
    }
  })

  const progress = document.querySelector('#progress')
  const progressTime = document.querySelector('#progress-time')
  const skipCountdownElement = document.querySelector('#skip-countdown')
  const postponeElement = document.querySelector('#postpone')
  const closeElement = document.querySelector('#close')
  const manualFinishElement = document.querySelector('#finish')
  const mainColor = await window.settings.get('mainColor')
  document.body.classList.add(mainColor.substring(1))
  document.body.style.backgroundColor = backgroundColor

  document.querySelectorAll('.tiptext').forEach(async tt => {
    const keyboardShortcut = await window.settings.get('endBreakShortcut')
    tt.innerHTML = window.utils.formatKeyboardShortcut(keyboardShortcut)
  })

  let manualAwaiting = false

  const locale = await window.settings.get('language')
  const skipDelayEnabled = await window.settings.get('skipDelayEnabled')
  const skipDelayDuration = await window.settings.get('skipDelayDuration')

  manualFinishElement.onclick = async () => {
    if (frictionEnabled) {
      await window.settings.saveSettings('microbreakSkipFrictionSequentialCount', 0)
    }
    await window.breaks.finishBreak()
  }

  setInterval(async () => {
    if (await window.settings.get('currentTimeInBreaks')) {
      document.querySelector('.breaks > :last-child').innerHTML = (new Date()).toLocaleTimeString()
    }
    const now = Date.now()
    const passed = now - started
    const skipDelayPassed = passed >= skipDelayDuration
    if (!manualAwaiting) {
      if (passed < duration) {
        const passedPercent = passed / duration * 100
        const canPostponeNow = window.utils.canPostpone(postpone, passedPercent, postponePercent)
        if (canPostponeNow) {
          postponeElement.classList.remove('hidden')
        } else {
          postponeElement.classList.add('hidden')
        }
        if (window.utils.canSkip(strictMode, postpone, passedPercent, postponePercent, skipDelayEnabled, skipDelayPassed, frictionEnabled)) {
          closeElement.classList.remove('hidden')
          skipCountdownElement.classList.add('hidden')
        } else {
          closeElement.classList.add('hidden')
          if (skipDelayEnabled && !skipDelayPassed && !canPostponeNow) {
            skipCountdownElement.innerHTML = await window.utils.formatTimeRemaining(skipDelayDuration - passed, locale)
            skipCountdownElement.classList.remove('hidden')
          } else {
            skipCountdownElement.classList.add('hidden')
          }
        }
        progress.value = (100 - passedPercent) * progress.max / 100
        progressTime.innerHTML = await window.utils.formatTimeRemaining(duration - passed, locale)
      }
    } else {
      progressTime.innerHTML = await window.utils.formatElapsedDuration(passed, locale)
    }
  }, 100)

  window.breaks.onEnterManualAwait(async (which) => {
    if (which !== 'microbreak' || manualAwaiting) return
    manualAwaiting = true
    progress.value = 0
    progressTime.classList.remove('hidden')
    postponeElement.classList.add('hidden')
    closeElement.classList.add('hidden')
    manualFinishElement.classList.remove('hidden')
    progressTime.innerHTML = await window.utils.formatElapsedDuration(Date.now() - started, locale)
  })

  await window.breaks.signalLoaded()
}
