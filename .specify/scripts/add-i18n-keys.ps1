# Script to add extended break trigger i18n keys to all locale files

$newKeys = @{
  'extendedBreakTriggers' = 'Extended break triggers:'
  'extendedBreakTriggersInfo' = 'Configure triggers that extend the duration of long breaks based on time of day or consecutive break count.'
  'triggerEnabled' = 'Enabled'
  'triggerType' = 'Type'
  'triggerCondition' = 'Condition'
  'triggerDuration' = 'Duration'
  'triggerActions' = 'Actions'
  'addTrigger' = 'Add Trigger'
  'noTriggersConfigured' = 'No triggers configured'
  'triggerTypeTimeOfDay' = 'Time of Day'
  'triggerTypeBreakCount' = 'Consecutive Breaks'
  'editTrigger' = 'Edit'
  'deleteTrigger' = 'Delete'
  'triggerTimeOfDayLabel' = 'Time (HH:mm)'
  'triggerBreakCountLabel' = 'After breaks'
  'triggerDurationLabel' = 'Extended duration (minutes)'
  'enterTriggerType' = 'Select trigger type'
  'enterTimeOfDay' = 'Enter time'
  'enterBreakCount' = 'After how many consecutive breaks'
  'enterDuration' = 'Extended duration'
  'confirmDelete' = 'Delete this trigger?'
  'cancel' = 'Cancel'
  'save' = 'Save'
  'editTriggerTitle' = 'Edit Trigger'
}

$localesDir = Join-Path $PSScriptRoot '..\..\app\locales'
$localeFiles = Get-ChildItem -Path $localesDir -Filter '*.json' | Where-Object { $_.Name -ne 'en.json' }

foreach ($file in $localeFiles) {
  $filePath = $file.FullName
  Write-Host "Processing $($file.Name)..."
  
  try {
    $content = Get-Content $filePath -Raw -Encoding UTF8
    $json = $content | ConvertFrom-Json
    
    # Check if preferences.settings exists
    if (-not $json.preferences) {
      Write-Warning "No preferences section in $($file.Name), skipping"
      continue
    }
    
    if (-not $json.preferences.settings) {
      Write-Warning "No preferences.settings section in $($file.Name), skipping"
      continue
    }
    
    # Add new keys if they don't exist
    $changed = $false
    foreach ($key in $newKeys.Keys) {
      if (-not $json.preferences.settings.PSObject.Properties[$key]) {
        $json.preferences.settings | Add-Member -NotePropertyName $key -NotePropertyValue $newKeys[$key] -Force
        $changed = $true
      }
    }
    
    if ($changed) {
      # Convert back to JSON with proper formatting
      $jsonOutput = $json | ConvertTo-Json -Depth 10 -Compress:$false
      Set-Content $filePath -Value $jsonOutput -Encoding UTF8 -NoNewline
      Write-Host "  [OK] Updated $($file.Name)"
    } else {
      Write-Host "  [SKIP] Keys already exist in $($file.Name)"
    }
  } catch {
    Write-Error "Failed to process $($file.Name): $_"
  }
}

Write-Host ""
Write-Host "Done! Processed $($localeFiles.Count) locale files."
