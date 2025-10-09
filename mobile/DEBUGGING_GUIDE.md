# Navigation Debugging Guide

## Overview
This debugging system helps identify and fix back button navigation issues in the React Native app.

## Features Added

### 1. Navigation Debugger Hook (`useNavigationDebugger`)
- **Location**: `mobile/hooks/useNavigationDebugger.ts`
- **Purpose**: Comprehensive navigation state tracking and back button debugging
- **Screens Using**: HistoryScreen, UniversalResultScreen, SettingsScreen, EnhancementPreferencesScreen, EmailSyncScreen

### 2. Enhanced Logging Features
- **Hardware Back Button**: Logs every back button press with navigation state
- **Navigation Events**: Monitors `beforeRemove` and `state` changes
- **Focus Tracking**: Logs screen focus/unfocus events
- **Navigation State**: Detailed stack and route information
- **Parent Navigation**: Shows nested navigator states

### 3. Debugging Tags
- 🚀 Component mount/log events
- 🧭 Navigation state changes
- 🔙 Hardware back button presses
- 🚪 Navigation events (beforeRemove, state changes)
- 📱 Focus state changes
- 🔧 Configuration logging
- ❌ Error states

## How to Use

### 1. Reproduce the Issue
1. Navigate to a screen where back button issues occur
2. Try using the back button (hardware or software)
3. Check the console logs for detailed debugging information

### 2. Look for Key Log Patterns

#### Normal Navigation Flow:
```
🚀 [ScreenName] Setting up navigation debugging
🚀 [ScreenName] Component mounted
🧭 [ScreenName] Navigation State: {...}
📱 [ScreenName] Focus state changed: { isFocused: true }
🔙 [ScreenName] Hardware back button pressed
🚪 [ScreenName] Navigation beforeRemove event: {...}
🧹 [ScreenName] Cleaning up navigation debugging
```

#### Problematic Navigation Flow:
```
🔙 [ScreenName] Hardware back button pressed
🧭 [ScreenName] Navigation State: { canGoBack: false, stackSize: 1, index: 0 }
```

### 3. Key Indicators of Issues

#### Issue 1: Navigation Stack Problems
- `canGoBack: false` when back button should work
- `stackSize: 1` when expecting multiple screens
- Missing `parent` navigator state

#### Issue 2: Screen Focus Problems
- Focus state not changing when expected
- Screen unfocused without navigation event

#### Issue 3: Navigation Event Problems
- Missing `beforeRemove` events
- Navigation commands not triggering state changes

### 4. Common Debugging Scenarios

#### Scenario A: Back Button Not Working
1. Go to HistoryScreen
2. Tap on a history item
3. In UniversalResultScreen, try back button
4. Check logs for:
   ```
   🔙 [UniversalResultScreen] Hardware back button pressed
   🧭 [UniversalResultScreen] Navigation State: { canGoBack: false, ... }
   ```
   If `canGoBack` is false, there's a navigation stack issue.

#### Scenario B: Settings Screen Issues
1. Navigate to SettingsScreen
2. Go to EnhancementPreferencesScreen
3. Try back button
4. Check logs for proper parent-child navigation

### 5. Console Filter Commands

#### For Chrome DevTools:
```javascript
// Filter for navigation events
console.clear();
// Look for these patterns in the console filter:
// [HistoryScreen], [UniversalResultScreen], [SettingsScreen]
// 🧭, 🔙, 🚪, 📱
```

#### For React Native Debugger:
```javascript
// Use the console filter functionality
// Filter by: [ScreenName] or 🧭 or 🔙
```

### 6. Analyzing Navigation State

The navigation state log includes:
- `isFocused`: Whether the screen is currently focused
- `currentRoute`: Name of the current route
- `stackSize`: Number of routes in the stack
- `index`: Current position in the stack
- `routeNames`: Array of all route names
- `canGoBack`: Whether navigation back is possible
- `parent`: Parent navigator state (if applicable)

### 7. Troubleshooting Steps

1. **Check if `canGoBack` is correct**
   - If false when it should be true: navigation stack issue
   - If true but back doesn't work: navigation handler issue

2. **Verify parent navigation state**
   - Missing parent: nested navigator problem
   - Parent state incorrect: navigator configuration issue

3. **Monitor focus state changes**
   - Focus not changing: screen lifecycle issue
   - Unexpected focus changes: navigation timing issue

4. **Check navigation events**
   - Missing events: event listener not registered
   - Event errors: navigation payload issue

### 8. Reporting Issues

When filing bug reports, include:
1. The complete console log for the problematic flow
2. Screens involved in the navigation
3. Whether it's hardware or software back button
4. Expected vs actual behavior
5. Navigation state at each step

## Screens with Debugging Enabled

- ✅ HistoryScreen
- ✅ UniversalResultScreen
- ✅ SettingsScreen
- ✅ EnhancementPreferencesScreen
- ✅ EmailSyncScreen

## Notes

- Debugging is **non-intrusive** - doesn't prevent normal navigation
- All logs include timestamps and screen names for easy filtering
- Hook automatically cleans up event listeners on unmount
- Parent navigator state helps identify nested navigation issues