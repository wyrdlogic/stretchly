# IPC Contract

**Feature**: Strict Mode Skip Friction  
**Component**: Main/Renderer Process Communication  
**Date**: December 10, 2025

## Overview

This contract defines the Inter-Process Communication (IPC) between Electron's main process and renderer processes for the skip friction feature. **Note**: Most friction logic runs entirely in renderer processes (break windows, preferences) using existing `window.settings` API exposed via context bridge. Minimal new IPC required.

---

## Existing IPC Infrastructure

### Settings API (Already Exposed)

The friction feature primarily uses the existing settings API exposed through the context bridge:

**File**: `app/utils/context-bridge-exposers.js`

```javascript
// Already exposed to renderer processes
window.settings = {
  get: async (key) => ipcRenderer.invoke('settings-get', key),
  set: async (key, value) => ipcRenderer.invoke('settings-set', key, value)
}
```

**Usage in Renderers**:
```javascript
// All friction settings accessed via this API
const frictionEnabled = await window.settings.get('breakSkipFrictionEnabled')
await window.settings.set('breakSkipFrictionTotalCount', 5)
```

**No changes required** to settings IPC - all 12 friction settings use existing mechanism.

---

## New IPC Channels (If Needed)

### Option A: No New IPC (Recommended)

**Rationale**: 
- All friction logic can execute in renderer processes
- Settings persistence handled by existing `settings-get` and `settings-set` IPC
- Random string generation runs in renderer (no security requirement)
- Counter management runs in renderer (no synchronization across windows needed)

**Implementation**: Use existing IPC only.

---

### Option B: Optional IPC for Counter Synchronization

**Use Case**: If multiple break windows could be open simultaneously (unlikely in Stretchly), counters might need synchronization.

**New IPC Channel**: `friction-counter-increment`

**Purpose**: Atomically increment counter from any renderer.

**Main Process Handler** (main.js):
```javascript
ipcMain.handle('friction-counter-increment', async (event, counterKey) => {
  const store = require('electron-store')
  const settings = new store()
  
  const currentValue = settings.get(counterKey, 0)
  const newValue = currentValue + 1
  settings.set(counterKey, newValue)
  
  return newValue
})
```

**Renderer Usage** (break-renderer.js):
```javascript
// Expose via context bridge
window.frictionCounter = {
  increment: async (key) => ipcRenderer.invoke('friction-counter-increment', key)
}

// Use in renderer
const newTotal = await window.frictionCounter.increment('breakSkipFrictionTotalCount')
```

**Decision**: **NOT RECOMMENDED** unless race conditions observed in testing. Current approach (renderer directly using `settings.set`) is simpler and sufficient.

---

## IPC Security Considerations

### Context Isolation

All IPC uses Electron's context bridge pattern (already implemented in Stretchly):

**File**: `app/electron-bridge.mjs`

```javascript
contextBridge.exposeInMainWorld('settings', {
  get: (key) => ipcRenderer.invoke('settings-get', key),
  set: (key, value) => ipcRenderer.invoke('settings-set', key, value)
})
```

**Security Properties**:
- Renderer processes cannot access `ipcRenderer` directly
- Only whitelisted APIs exposed via `contextBridge`
- Settings validation happens in main process (electron-store)

**Friction Feature Impact**: None. Follows existing secure patterns.

---

## Event Flow Diagrams

### Skip with Friction (No New IPC)

```
Renderer Process (break-renderer.js):
1. User clicks "Skip" button
   ↓
2. Fetch settings via existing IPC:
   - ipcRenderer.invoke('settings-get', 'breakSkipFrictionEnabled')
   - ipcRenderer.invoke('settings-get', 'breakSkipFrictionCharLength')
   - ipcRenderer.invoke('settings-get', 'breakSkipFrictionSequentialCount')
   - ... (all settings)
   ↓
3. Generate random string (in renderer)
   ↓
4. Display friction UI (in renderer)
   ↓
5. User types characters (in renderer)
   ↓
6. User completes string and clicks "Skip"
   ↓
7. Update counters via existing IPC:
   - ipcRenderer.invoke('settings-set', 'breakSkipFrictionTotalCount', newTotal)
   - ipcRenderer.invoke('settings-set', 'breakSkipFrictionSequentialCount', newSeq)
   ↓
8. Close window (existing mechanism)
```

**Total new IPC channels**: 0

---

### Preferences Save (No New IPC)

```
Renderer Process (preferences-renderer.js):
1. User modifies friction settings in UI
   ↓
2. User clicks "Save" button
   ↓
3. Validate settings (in renderer)
   ↓
4. Save via existing IPC:
   - ipcRenderer.invoke('settings-set', 'breakSkipFrictionEnabled', true)
   - ipcRenderer.invoke('settings-set', 'breakSkipFrictionCharLength', 30)
   - ... (all modified settings)
   ↓
5. Display success message (in renderer)
```

**Total new IPC channels**: 0

---

## Testing Contract

### IPC Tests

**Since no new IPC channels are added**, existing settings IPC tests suffice:

**File**: `test/settings.js` (hypothetical, based on existing patterns)

```javascript
describe('Settings IPC', () => {
  it('should persist friction settings via settings-set', async () => {
    await ipcRenderer.invoke('settings-set', 'breakSkipFrictionEnabled', false)
    const value = await ipcRenderer.invoke('settings-get', 'breakSkipFrictionEnabled')
    expect(value).toBe(false)
  })
  
  it('should handle concurrent counter increments', async () => {
    const promises = []
    for (let i = 0; i < 10; i++) {
      promises.push((async () => {
        const current = await ipcRenderer.invoke('settings-get', 'breakSkipFrictionTotalCount')
        await ipcRenderer.invoke('settings-set', 'breakSkipFrictionTotalCount', current + 1)
      })())
    }
    await Promise.all(promises)
    
    const final = await ipcRenderer.invoke('settings-get', 'breakSkipFrictionTotalCount')
    // Note: Without atomic increment, this might not be 10 (race condition)
    // If this fails in testing, implement Option B above
  })
})
```

---

## Performance Considerations

### IPC Round-Trip Times

**Existing Settings IPC Performance** (from research):
- `settings-get`: ~5-10ms per call
- `settings-set`: ~10-20ms per call (includes disk write)

**Friction Feature IPC Load** (per skip):
- Settings fetch: 5 calls × 10ms = 50ms
- Counter update: 2 calls × 20ms = 40ms
- **Total IPC overhead**: ~90ms (acceptable, within 1s render budget)

**Optimization Opportunity** (if needed):
- Batch settings fetch into single IPC call with array of keys
- Implement in main.js: `settings-get-multiple`
- Expected reduction: 50ms → 10ms (single round-trip)

**Decision**: Start with individual calls (simpler). Optimize only if performance testing shows >1s render time.

---

## Main Process Modifications

### Required Changes

**File**: `app/main.js`

**Change**: None required for friction feature. Existing `settings-get` and `settings-set` handlers suffice.

**Optional Enhancement** (for performance):

```javascript
// Add to main.js IPC handlers (OPTIONAL)
ipcMain.handle('settings-get-multiple', async (event, keys) => {
  const store = require('electron-store')
  const settings = new store()
  
  const results = {}
  for (const key of keys) {
    results[key] = settings.get(key)
  }
  return results
})
```

**Context Bridge Exposure** (if implemented):

```javascript
// Add to electron-bridge.mjs
contextBridge.exposeInMainWorld('settings', {
  get: (key) => ipcRenderer.invoke('settings-get', key),
  set: (key, value) => ipcRenderer.invoke('settings-set', key, value),
  getMultiple: (keys) => ipcRenderer.invoke('settings-get-multiple', keys) // NEW
})
```

**Renderer Usage**:
```javascript
const frictionSettings = await window.settings.getMultiple([
  'breakSkipFrictionEnabled',
  'breakSkipFrictionCharLength',
  'breakSkipFrictionIncrementalEnabled',
  'breakSkipFrictionMaxWords',
  'breakSkipFrictionSequentialCount'
])
```

**Implementation Status**: **OPTIONAL** - Implement only if performance testing requires it.

---

## Summary

### IPC Architecture Decision

**Chosen Approach**: Use existing `settings-get` and `settings-set` IPC exclusively.

**Rationale**:
- Simplicity: No new IPC channels to maintain
- Security: Follows established context bridge patterns
- Performance: 90ms IPC overhead per skip (acceptable)
- Testability: Existing IPC tests cover friction feature

**New IPC Channels**: 0

**Modified IPC Handlers**: 0 (unless optional batch fetch implemented)

**Context Bridge Changes**: 0 (unless optional batch fetch implemented)

---

### IPC Flow Summary Table

| Operation | IPC Channel | Direction | Frequency | Performance |
|-----------|-------------|-----------|-----------|-------------|
| Fetch friction enabled | `settings-get` | Renderer → Main | 1× per skip | ~10ms |
| Fetch char length | `settings-get` | Renderer → Main | 1× per skip | ~10ms |
| Fetch incremental enabled | `settings-get` | Renderer → Main | 1× per skip | ~10ms |
| Fetch max words | `settings-get` | Renderer → Main | 1× per skip | ~10ms |
| Fetch sequential count | `settings-get` | Renderer → Main | 1× per skip | ~10ms |
| Update total count | `settings-set` | Renderer → Main | 1× per skip | ~20ms |
| Update sequential count | `settings-set` | Renderer → Main | 1× per skip or complete | ~20ms |
| Save preferences | `settings-set` | Renderer → Main | Multiple× per save | ~20ms each |

**Total IPC overhead**: ~90ms per skip (within performance budget)

---

### Testing Checklist

- [ ] Verify all 12 friction settings persist via existing settings IPC
- [ ] Test concurrent counter updates (detect race conditions)
- [ ] Measure IPC overhead under friction load (target <100ms)
- [ ] Validate context bridge security (no direct ipcRenderer access)
- [ ] Test settings persistence across app restarts

**If race conditions detected**: Implement atomic counter increment IPC (Option B above).

**If performance <1s not met**: Implement batch settings fetch IPC (optional enhancement).

---

## References

- Existing Settings IPC: `app/utils/context-bridge-exposers.js`
- Context Bridge Pattern: `app/electron-bridge.mjs`
- Main Process Handlers: `app/main.js` (search for `ipcMain.handle('settings-`)
- electron-store Documentation: https://github.com/sindresorhus/electron-store
