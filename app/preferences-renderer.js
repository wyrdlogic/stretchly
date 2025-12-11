import VersionChecker from './utils/versionChecker.js'
import { setSameWidths } from './utils/sameWidths.js'
import HtmlTranslate from './utils/htmlTranslate.js'

import './platform.js'

/* global confirm */

const versionChecker = new VersionChecker()
let eventsAttached = false

window.onload = async (e) => {
  const bounds = await window.stretchly.getWindowBounds()
  const settings = await window.settings.currentSettings()
  if (settings.disableAppUpdateFeatures) {
    document.querySelector('#checkNewVersion').closest('div').classList.add('hidden')
  }

  if (settings.hideStrictModePreferences) {
    document.querySelectorAll('[data-strict-mode]').forEach(element => {
      element.classList.add('hidden')
    })
    document.querySelector('#enablePostponeLong').closest('div').style.marginBottom = '56px'
  }

  if (settings.hidePreferencesFileLocation) {
    document.querySelectorAll('[data-preferences-file]').forEach(element => {
      element.classList.add('hidden')
    })
  }

  new HtmlTranslate(document).translate()
  setWindowHeight()
  setTimeout(() => { eventsAttached = true }, 500)

  if (settings.customPreferencesMessage) {
    const customMessageDiv = document.createElement('div')
    customMessageDiv.className = 'custom-message'
    customMessageDiv.textContent = settings.customPreferencesMessage
    document.querySelector('.navigation').parentNode.insertBefore(customMessageDiv, document.querySelector('.navigation').nextSibling)
  }

  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    const imagesWithDarkVersion = document.querySelectorAll('[data-has-dark-version]')
    imagesWithDarkVersion.forEach(image => {
      // replace last occurance https://github.com/electron-userland/electron-builder/issues/5152
      const newSource = image.src.replace(/.([^.]*)$/, '-dark.' + '$1')
      image.src = newSource
    })
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    const imagesWithDarkVersion = document.querySelectorAll('[data-has-dark-version]')
    if (event.matches) {
      imagesWithDarkVersion.forEach(image => {
        const newSource = image.src.replace(/.([^.]*)$/, '-dark.' + '$1')
        image.src = newSource
      })
    } else {
      imagesWithDarkVersion.forEach(image => {
        const newSource = image.src.replace('-dark.', '.')
        image.src = newSource
      })
    }
  })

  document.ondragover = event =>
    event.preventDefault()

  document.ondrop = event =>
    event.preventDefault()

  document.onkeydown = async event => {
    if (event.key === 'd' && (event.ctrlKey || event.metaKey)) {
      const [
        reference, timeleft, breaknumber,
        postponesnumber, settingsfile, logsfile, doNotDisturb, imagesfolder
      ] = await window.stretchly.showDebug()
      const debugInfo = document.querySelector('.debug > :first-child')
      if (!debugInfo.classList.contains('hidden')) {
        debugInfo.classList.add('hidden')
      } else {
        debugInfo.classList.remove('hidden')
        document.querySelector('#reference').innerHTML = reference
        document.querySelector('#timeleft').innerHTML = timeleft
        document.querySelector('#breakNumber').innerHTML = breaknumber
        document.querySelector('#postponesNumber').innerHTML = postponesnumber
        document.querySelector('#settingsfile').innerHTML = settingsfile
        document.querySelector('#logsfile').innerHTML = logsfile
        document.querySelector('#imagesfolder').innerHTML = imagesfolder
        document.querySelector('#donotdisturb').innerHTML = doNotDisturb
        document.querySelector('#node').innerHTML = await window.runtime.node()
        document.querySelector('#chrome').innerHTML = await window.runtime.chrome()
        document.querySelector('#electron').innerHTML = await window.runtime.electron()
        document.querySelector('#platform').innerHTML = await window.runtime.platform()
        document.querySelector('#windowsStore').innerHTML = await window.runtime.windowsStore() || false
      }
      setWindowHeight()
    }
  }

  window.stretchly.onTranslate(async () => {
    new HtmlTranslate(document).translate()
    document.querySelectorAll('input[type="range"]').forEach(async range => {
      const settings = await window.settings.currentSettings()
      const divisor = range.dataset.divisor
      const output = range.closest('div').querySelector('output')
      range.value = settings[range.name] / divisor
      const unit = output.dataset.unit
      output.innerHTML = await window.utils.formatUnitAndValue(unit, range.value)
      document.querySelector('#longBreakEvery').closest('div').querySelector('output')
        .innerHTML = await window.i18next.t('utils.minutes', { count: parseInt(realBreakInterval()) })
    })
    setWindowHeight()
  })

  window.stretchly.onEnableContributorPreferences(() => {
    showContributorPreferencesButton()
  })

  const showContributorPreferencesButton = () => {
    document.querySelectorAll('.contributor').forEach((item) => {
      item.classList.remove('hidden')
    })
    document.querySelectorAll('.become').forEach((item) => {
      item.classList.add('hidden')
    })
    document.querySelectorAll('.authenticate').forEach((item) => {
      item.classList.add('hidden')
    })
    setWindowHeight()
  }

  if (await window.global.getValue('isContributor')) {
    showContributorPreferencesButton()
  }

  document.querySelector('[name="contributorPreferences"]').onclick = (event) => {
    event.preventDefault()
    window.stretchly.openContributorPreferences()
  }

  document.querySelector('[name="syncPreferences"]').onclick = (event) => {
    event.preventDefault()
    window.stretchly.openSyncPreferences()
  }

  document.querySelector('.debug button').onclick = async (event) => {
    event.preventDefault()
    const toCopy = document.querySelector('#to-copy')
    await navigator.clipboard.writeText(toCopy.textContent)
    const copiedEl = document.createElement('span')
    copiedEl.innerHTML = ' copied!'
    event.target.parentNode.appendChild(copiedEl)
    setTimeout(() => copiedEl.remove(), 1275)
  }

  document.querySelectorAll('.navigation a').forEach(element => {
    element.onclick = event => {
      event.preventDefault()
      event.target.closest('.navigation').childNodes.forEach(link => {
        if (link.classList) {
          link.classList.remove('active')
        }
      })
      event.target.closest('a').classList.add('active')

      const toBeDisplayed = document.querySelector(`.${event.target.closest('[data-section]').getAttribute('data-section')}`)
      document.querySelectorAll('body > div:not(.custom-message)').forEach(section => {
        if (section !== toBeDisplayed) {
          section.classList.add('hidden')
        } else {
          section.classList.remove('hidden')
        }
      })

      setSameWidths()
      setWindowHeight()
    }
  })

  const skipDelayCheckbox = document.querySelector('#enableSkipDelay')
  const skipDelayInput = document.querySelector('#skipDelayDuration')

  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    const isNegative = checkbox.classList.contains('negative')
    checkbox.checked = isNegative ? !settings[checkbox.value] : settings[checkbox.value]
    if (!eventsAttached) {
      checkbox.onchange = (event) => {
        window.settings.saveSettings(checkbox.value,
          isNegative ? !checkbox.checked : checkbox.checked)
        if (checkbox === skipDelayCheckbox && skipDelayInput) {
          skipDelayInput.disabled = !skipDelayCheckbox.checked
        }
      }
    }
  })

  if (skipDelayCheckbox && skipDelayInput) {
    skipDelayInput.disabled = !skipDelayCheckbox.checked
  }

  // Friction settings
  const microbreakFrictionCharLength = document.querySelector('#microbreakFrictionCharLength')
  const microbreakFrictionMaxWords = document.querySelector('#microbreakFrictionMaxWords')
  const microbreakFrictionTotalCount = document.querySelector('#microbreakFrictionTotalCount')
  const resetMicrobreakFrictionButton = document.querySelector('#resetMicrobreakFrictionCounter')

  const breakFrictionCharLength = document.querySelector('#breakFrictionCharLength')
  const breakFrictionMaxWords = document.querySelector('#breakFrictionMaxWords')
  const breakFrictionTotalCount = document.querySelector('#breakFrictionTotalCount')
  const resetBreakFrictionButton = document.querySelector('#resetBreakFrictionCounter')

  if (microbreakFrictionCharLength) {
    microbreakFrictionCharLength.value = settings.microbreakSkipFrictionCharLength
    if (!eventsAttached) {
      microbreakFrictionCharLength.onchange = (event) => {
        const value = parseInt(event.target.value)
        if (value < 1 || value > 50) {
          window.alert('Character length must be between 1 and 50')
          event.target.value = settings.microbreakSkipFrictionCharLength
          return
        }
        window.settings.saveSettings('microbreakSkipFrictionCharLength', value)
      }
    }
  }

  if (microbreakFrictionMaxWords) {
    microbreakFrictionMaxWords.value = settings.microbreakSkipFrictionMaxWords
    if (!eventsAttached) {
      microbreakFrictionMaxWords.onchange = (event) => {
        const value = parseInt(event.target.value)
        if (value < 1 || value > 20) {
          window.alert('Maximum words must be between 1 and 20')
          event.target.value = settings.microbreakSkipFrictionMaxWords
          return
        }
        window.settings.saveSettings('microbreakSkipFrictionMaxWords', value)
      }
    }
  }

  if (microbreakFrictionTotalCount) {
    microbreakFrictionTotalCount.textContent = settings.microbreakSkipFrictionTotalCount
  }

  if (resetMicrobreakFrictionButton && !eventsAttached) {
    resetMicrobreakFrictionButton.onclick = async () => {
      await window.settings.saveSettings('microbreakSkipFrictionTotalCount', 0)
      await window.settings.saveSettings('microbreakSkipFrictionSequentialCount', 0)
      microbreakFrictionTotalCount.textContent = '0'
    }
  }

  if (breakFrictionCharLength) {
    breakFrictionCharLength.value = settings.breakSkipFrictionCharLength
    if (!eventsAttached) {
      breakFrictionCharLength.onchange = (event) => {
        const value = parseInt(event.target.value)
        if (value < 1 || value > 50) {
          window.alert('Character length must be between 1 and 50')
          event.target.value = settings.breakSkipFrictionCharLength
          return
        }
        window.settings.saveSettings('breakSkipFrictionCharLength', value)
      }
    }
  }

  if (breakFrictionMaxWords) {
    breakFrictionMaxWords.value = settings.breakSkipFrictionMaxWords
    if (!eventsAttached) {
      breakFrictionMaxWords.onchange = (event) => {
        const value = parseInt(event.target.value)
        if (value < 1 || value > 20) {
          window.alert('Maximum words must be between 1 and 20')
          event.target.value = settings.breakSkipFrictionMaxWords
          return
        }
        window.settings.saveSettings('breakSkipFrictionMaxWords', value)
      }
    }
  }

  if (breakFrictionTotalCount) {
    breakFrictionTotalCount.textContent = settings.breakSkipFrictionTotalCount
  }

  if (resetBreakFrictionButton && !eventsAttached) {
    resetBreakFrictionButton.onclick = async () => {
      await window.settings.saveSettings('breakSkipFrictionTotalCount', 0)
      await window.settings.saveSettings('breakSkipFrictionSequentialCount', 0)
      breakFrictionTotalCount.textContent = '0'
    }
  }

  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    let value
    switch (radio.value) {
      case 'true':
        value = true
        break
      case 'false':
        value = false
        break
      default:
        value = radio.value
    }
    radio.checked = settings[radio.name] === value
    if (!eventsAttached) {
      radio.onchange = (event) => {
        window.settings.saveSettings(radio.name, value)
      }
    }
  })

  document.querySelector('#language').value = settings.language
  if (!eventsAttached) {
    document.querySelector('#language').onchange = (event) => {
      window.settings.saveSettings('language', event.target.value)
    }
  }

  document.querySelector('#trayIconStyle').value = settings.trayIconStyle
  if (!eventsAttached) {
    document.querySelector('#trayIconStyle').onchange = (event) => {
      window.settings.saveSettings('trayIconStyle', event.target.value)
    }
  }

  document.querySelectorAll('input[type="range"]').forEach(async range => {
    const divisor = range.dataset.divisor
    const output = range.closest('div').querySelector('output')
    range.value = settings[range.name] / divisor
    const unit = output.dataset.unit
    output.innerHTML = await window.utils.formatUnitAndValue(unit, range.value)
    document.querySelector('#longBreakEvery').closest('div').querySelector('output')
      .innerHTML = await window.i18next.t('utils.minutes', { count: parseInt(realBreakInterval()) })
    if (!eventsAttached) {
      range.onchange = async event => {
        output.innerHTML = await window.utils.formatUnitAndValue(unit, range.value)
        document.querySelector('#longBreakEvery').closest('div').querySelector('output')
          .innerHTML = await window.i18next.t('utils.minutes', { count: parseInt(realBreakInterval()) })
        window.settings.saveSettings(range.name, range.value * divisor)
      }
      range.oninput = async event => {
        output.innerHTML = await window.utils.formatUnitAndValue(unit, range.value)
        document.querySelector('#longBreakEvery').closest('div').querySelector('output')
          .innerHTML = await window.i18next.t('utils.minutes', { count: parseInt(realBreakInterval()) })
      }
    }
  })

  document.querySelectorAll('.sounds img').forEach(preview => {
    if (!eventsAttached) {
      preview.onclick = (event) =>
        window.stretchly.playSound(preview.closest('div').querySelector('input').value)
    }
  })

  setWindowHeight()

  document.querySelectorAll('.enabletype').forEach((element) => {
    element.onclick = async (event) => {
      const enabletypeChecked = document.querySelectorAll('.enabletype:checked')
      if (enabletypeChecked.length === 0) {
        element.checked = true
        window.settings.saveSettings(element.value, element.checked)
        window.alert(await window.i18next.t('preferences.schedule.cantDisableBoth'))
      }
    }
  })

  document.querySelector('.settings > div > button').onclick = (event) => {
    window.stretchly.restoreDefaults()
  }

  document.querySelectorAll('.about a').forEach((item) => {
    item.onclick = (event) => {
      event.preventDefault()
      if (event.target.classList.contains('file')) {
        window.electronApi.openPath(event.target.innerHTML)
      } else {
        window.electronApi.openExternal(event.target.href)
      }
    }
  })

  document.querySelector('[name="becomeContributor"]').onclick = () => {
    window.electronApi.openExternal('https://hovancik.net/stretchly/sponsor')
  }

  document.querySelector('[name="alreadyContributor"]').onclick = () => {
    document.querySelectorAll('.become').forEach((item) => {
      item.classList.add('hidden')
    })
    document.querySelectorAll('.authenticate').forEach((item) => {
      item.classList.remove('hidden')
    })
    setWindowHeight()
  }

  document.querySelectorAll('.authenticate a').forEach((button) => {
    button.onclick = (event) => {
      event.preventDefault()
      window.stretchly.openContributorAuth(button.dataset.provider)
    }
  })

  document.querySelector('.version').innerHTML = await window.stretchly.getVersion()
  if (!settings.disableAppUpdateFeatures) {
    versionChecker.latest()
      .then(version => {
        document.querySelector('.latestVersion').innerHTML = version.replace('v', '')
      })
      .catch(exception => {
        console.error(exception)
        document.querySelector('.latestVersion').innerHTML = 'N/A'
      })
  }

  function setWindowHeight () {
    const classes = document.querySelector('body').classList
    const scrollHeight = document.querySelector('body').scrollHeight
    const availHeight = window.screen.availHeight
    let height = null
    if (classes.contains('win32')) {
      if (scrollHeight + 40 > availHeight) {
        height = availHeight
      } else {
        height = scrollHeight + 40
      }
    } else {
      if (scrollHeight + 32 > availHeight) {
        height = availHeight
      } else {
        height = scrollHeight + 32
      }
    }
    if (height) {
      window.stretchly.setWindowSize(bounds.width, height)
    }
  }

  function realBreakInterval () {
    const microbreakInterval = document.querySelector('#miniBreakEvery').value * 1
    const breakInterval = document.querySelector('#longBreakEvery').value * 1
    return microbreakInterval * (breakInterval + 1)
  }

  async function loadExtendedBreakTriggers () {
    try {
      const response = await window.stretchly.getExtendedBreakTriggers()
      if (response && response.success) {
        await renderTriggerTable(response.data || [])
      } else {
        console.error('Failed to load triggers:', response?.error)
        await renderTriggerTable([])
      }
    } catch (error) {
      console.error('Error loading extended break triggers:', error)
      await renderTriggerTable([])
    }
  }

  async function renderTriggerTable (triggers) {
    const tbody = document.querySelector('#extendedBreakTriggersBody')
    tbody.innerHTML = ''

    if (triggers.length === 0) {
      const row = tbody.insertRow()
      const cell = row.insertCell()
      cell.colSpan = 4
      cell.textContent = await window.i18next.t('preferences.schedule.noTriggersConfigured')
      cell.style.textAlign = 'center'
      cell.style.fontStyle = 'italic'
      cell.style.color = 'var(--main-color)'
      return
    }

    for (const trigger of triggers) {
      const row = tbody.insertRow()

      const typeCell = row.insertCell()
      if (trigger.type === 'time-of-day') {
        typeCell.textContent = await window.i18next.t('preferences.schedule.triggerTypeTimeOfDay')
      } else if (trigger.type === 'break-count') {
        typeCell.textContent = await window.i18next.t('preferences.schedule.triggerTypeBreakCount')
      }

      const conditionCell = row.insertCell()
      if (trigger.type === 'time-of-day') {
        conditionCell.textContent = trigger.timeOfDay || '-'
      } else if (trigger.type === 'break-count') {
        conditionCell.textContent = trigger.breakCount || '-'
      }

      const durationCell = row.insertCell()
      const minutes = Math.floor(trigger.duration / 60000)
      durationCell.textContent = await window.i18next.t('utils.minutes', { count: minutes })

      const actionsCell = row.insertCell()
      const editButton = document.createElement('button')
      editButton.type = 'button'
      editButton.textContent = await window.i18next.t('preferences.schedule.editTrigger')
      editButton.dataset.triggerId = trigger.id
      editButton.classList.add('edit-trigger')

      const deleteButton = document.createElement('button')
      deleteButton.type = 'button'
      deleteButton.textContent = await window.i18next.t('preferences.schedule.deleteTrigger')
      deleteButton.dataset.triggerId = trigger.id
      deleteButton.classList.add('delete-trigger')

      actionsCell.appendChild(editButton)
      actionsCell.appendChild(document.createTextNode(' '))
      actionsCell.appendChild(deleteButton)
    }
  }

  function openTriggerModal (mode, trigger = null) {
    const modal = document.querySelector('#triggerModal')
    const form = document.querySelector('#triggerForm')
    const modalTitle = document.querySelector('#modalTitle')
    const typeSelect = document.querySelector('#triggerType')
    const timeOfDayInput = document.querySelector('#timeOfDay')
    const breakCountInput = document.querySelector('#breakCount')
    const durationInput = document.querySelector('#triggerDuration')
    const timeOfDayGroup = document.querySelector('#timeOfDayGroup')
    const breakCountGroup = document.querySelector('#breakCountGroup')

    form.reset()
    form.dataset.mode = mode
    if (trigger) {
      form.dataset.triggerId = trigger.id
    } else {
      delete form.dataset.triggerId
    }

    if (mode === 'edit' && trigger) {
      modalTitle.setAttribute('data-i18next', 'preferences.schedule.editTriggerTitle')
      typeSelect.value = trigger.type
      if (trigger.type === 'time-of-day') {
        timeOfDayInput.value = trigger.timeOfDay
        timeOfDayGroup.style.display = 'block'
        breakCountGroup.style.display = 'none'
      } else if (trigger.type === 'break-count') {
        breakCountInput.value = trigger.breakCount
        timeOfDayGroup.style.display = 'none'
        breakCountGroup.style.display = 'block'
      }
      durationInput.value = Math.floor(trigger.duration / 60000)
    } else {
      modalTitle.setAttribute('data-i18next', 'preferences.schedule.addTrigger')
      typeSelect.value = ''
      timeOfDayGroup.style.display = 'none'
      breakCountGroup.style.display = 'none'
    }

    new HtmlTranslate(document.querySelector('#triggerModal')).translate()
    modal.classList.remove('hidden')
  }

  function closeTriggerModal () {
    const modal = document.querySelector('#triggerModal')
    modal.classList.add('hidden')
  }

  async function handleTriggerTypeChange () {
    const typeSelect = document.querySelector('#triggerType')
    const timeOfDayGroup = document.querySelector('#timeOfDayGroup')
    const breakCountGroup = document.querySelector('#breakCountGroup')

    if (typeSelect.value === 'time-of-day') {
      timeOfDayGroup.style.display = 'block'
      breakCountGroup.style.display = 'none'
      document.querySelector('#timeOfDay').required = true
      document.querySelector('#breakCount').required = false
    } else if (typeSelect.value === 'break-count') {
      timeOfDayGroup.style.display = 'none'
      breakCountGroup.style.display = 'block'
      document.querySelector('#timeOfDay').required = false
      document.querySelector('#breakCount').required = true
    } else {
      timeOfDayGroup.style.display = 'none'
      breakCountGroup.style.display = 'none'
      document.querySelector('#timeOfDay').required = false
      document.querySelector('#breakCount').required = false
    }
  }

  async function handleTriggerFormSubmit (event) {
    event.preventDefault()

    const form = event.target
    const mode = form.dataset.mode
    const type = document.querySelector('#triggerType').value
    const durationMinutes = parseInt(document.querySelector('#triggerDuration').value)
    const duration = durationMinutes * 60000

    const config = {
      type,
      duration,
      enabled: true
    }

    if (type === 'time-of-day') {
      config.timeOfDay = document.querySelector('#timeOfDay').value
    } else if (type === 'break-count') {
      config.breakCount = parseInt(document.querySelector('#breakCount').value)
    }

    try {
      let response
      if (mode === 'edit') {
        const triggerId = form.dataset.triggerId
        response = await window.stretchly.updateExtendedBreakTrigger(triggerId, config)
      } else {
        response = await window.stretchly.createExtendedBreakTrigger(config)
      }

      if (response && response.success) {
        closeTriggerModal()
        await loadExtendedBreakTriggers()
      } else {
        console.error('Failed to save trigger:', response?.error)
        alert('Failed to save trigger: ' + (response?.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving trigger:', error)
      alert('Error saving trigger: ' + error.message)
    }
  }

  async function handleDeleteTrigger (triggerId) {
    const confirmMessage = await window.i18next.t('preferences.schedule.confirmDelete')
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await window.stretchly.deleteExtendedBreakTrigger(triggerId)
      if (response && response.success) {
        await loadExtendedBreakTriggers()
      } else {
        console.error('Failed to delete trigger:', response?.error)
        alert('Failed to delete trigger: ' + (response?.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting trigger:', error)
      alert('Error deleting trigger: ' + error.message)
    }
  }

  // Event listeners for trigger management
  document.querySelector('#addTriggerButton').addEventListener('click', () => {
    openTriggerModal('create')
  })

  document.querySelector('#cancelButton').addEventListener('click', () => {
    closeTriggerModal()
  })

  document.querySelector('#triggerType').addEventListener('change', handleTriggerTypeChange)

  document.querySelector('#triggerForm').addEventListener('submit', handleTriggerFormSubmit)

  document.querySelector('#extendedBreakTriggersBody').addEventListener('click', async (event) => {
    if (event.target.classList.contains('edit-trigger')) {
      const triggerId = event.target.dataset.triggerId
      const response = await window.stretchly.getExtendedBreakTriggers()
      if (response && response.success) {
        const trigger = response.data.find(t => t.id === triggerId)
        if (trigger) {
          openTriggerModal('edit', trigger)
        }
      }
    } else if (event.target.classList.contains('delete-trigger')) {
      const triggerId = event.target.dataset.triggerId
      await handleDeleteTrigger(triggerId)
    }
  })

  loadExtendedBreakTriggers()
}
