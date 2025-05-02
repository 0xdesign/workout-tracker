# Workout Tracker Testing Plan

## Overview

This document outlines the testing strategy for the recent improvements to the workout-tracker application, specifically focusing on:
1. Enhanced workout ID recognition with spaces and fuzzy matching
2. Mode toggle between advice and modification modes
3. Improved workout change visualization

## Test Environment Setup

1. **Local Development Environment**
   - Run the application locally using `cd workout-tracker && npm run dev`
   - Access the application at `http://localhost:3000`

2. **Sample Data Requirements**
   - Ensure multiple workout plans are available with different naming conventions
   - Include workout names with spaces (e.g., "UPPER BODY B")
   - Include workout exercises with various parameters (weights, reps, sets)

## Testing Areas

### 1. Workout ID Recognition Tests

| Test ID | Description | Input | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| ID-01 | Standard format workout ID | "modify workout ID: upper_body_a" | Successfully identifies "upper_body_a" | High |
| ID-02 | Workout ID with spaces | "modify UPPER BODY B workout" | Successfully identifies "UPPER BODY B" | High |
| ID-03 | Natural language variation | "I want to change my Upper Body B workout" | Successfully identifies "Upper Body B" | Medium |
| ID-04 | Slightly misspelled workout ID | "modify Uper Boody B" | Suggests "UPPER BODY B" through fuzzy matching | Medium |
| ID-05 | Non-existent workout ID | "modify XYZ workout" | Shows helpful error with workout suggestions | High |
| ID-06 | Multiple workout name patterns | Various phrasings of the same request | Consistent workout identification | Low |

### 2. Mode Toggle Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| MT-01 | Toggle from advice to modification | Click toggle button in advice mode | UI changes to modification mode with correct styling | High |
| MT-02 | Toggle from modification to advice | Click toggle button in modification mode | UI changes to advice mode with correct styling | High |
| MT-03 | Mode persistence | 1. Set mode to modification<br>2. Refresh page | Mode remains set to modification | Medium |
| MT-04 | Input placeholder changes | Switch between modes | Input placeholder updates appropriately for each mode | Low |
| MT-05 | Border color changes | Switch between modes | Main UI border changes color based on current mode | Low |

### 3. Visualization Enhancement Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| VE-01 | Exercise names display | Generate workout modification | Exercise names appear alongside IDs | High |
| VE-02 | Visual change indicators | View proposed changes | Correct icons and colors for increase/decrease | High |
| VE-03 | Before/after comparison | View proposed changes | Clear visualization of current vs. proposed values | High |
| VE-04 | Impact summaries | View proposed changes | Summary of expected impact for each exercise | Medium |
| VE-05 | Formatting with units | View weight changes | Values show appropriate units (e.g., "lbs") | Medium |

### 4. User Journey Tests

| Test ID | Description | Steps | Success Criteria | Priority |
|---------|-------------|-------|-----------------|----------|
| UJ-01 | Advice mode usage | 1. Ensure in advice mode<br>2. Ask workout question | Receives advice without modification UI | High |
| UJ-02 | Workout discovery | 1. Switch to modification mode<br>2. Type "list workouts" | Displays workouts with clickable options | High |
| UJ-03 | Complete modification flow | 1. Request workout modification<br>2. Review changes<br>3. Apply changes | Changes applied successfully with confirmation | High |
| UJ-04 | Error recovery | 1. Request non-existent workout<br>2. Follow suggestion | Successfully recovers and completes task | Medium |

## Automated Testing with Browserbase

### Setup Steps

1. Install Browserbase testing dependencies
2. Set up test environment variables
3. Configure test runner

### Sample Test Script

```javascript
// Sample test script for Browserbase

// 1. Navigate to app
navigate('http://localhost:3000/coach');

// 2. Wait for app to load
wait('.chat-interface');

// 3. Test mode toggle
click('.mode-toggle-button');
verifyElement('.modification-mode-indicator');

// 4. Test workout ID with spaces
fillText('input.chat-input', 'modify UPPER BODY B workout');
click('button.send-button');
verifyElement('.workout-proposal');

// 5. Test fuzzy matching
fillText('input.chat-input', 'modify Uper Boody B');
click('button.send-button');
verifyText('Did you mean "UPPER BODY B"?');

// 6. Test workout visualization
click('.workout-selector-button');
verifyElement('.workout-change-proposal');
verifyElement('.exercise-name-display');
verifyElement('.change-indicator');

// 7. Test applying changes
click('.apply-changes-button');
verifyElement('.success-notification');
```

## Manual Testing Checklist

- [ ] Verify visual appearance matches design in different screen sizes
- [ ] Test keyboard navigation for accessibility
- [ ] Validate all error messages are helpful and actionable
- [ ] Test with screen reader for accessibility
- [ ] Verify animation performance on lower-end devices
- [ ] Test with large workout plans to check performance

## Performance Testing

- Load time for coach interface
- Time to process workout modification requests
- Response time for fuzzy matching
- Memory usage with large workout plans

## Acceptance Criteria

1. 95%+ workout ID recognition accuracy regardless of format
2. Clear visual distinction between advice and modification modes
3. Error messages provide actionable guidance
4. All visualization enhancements render correctly across browsers
5. No regression in existing functionality

## Testing Schedule

1. Automated tests: Daily during development
2. Manual testing: Prior to each PR merge
3. Performance testing: Weekly
4. User acceptance testing: Prior to release

## Reporting

Test results will be documented in the GitHub repository with:
- Screenshots of UI components
- List of any identified issues
- Performance metrics
- Recommendations for further improvements

## Responsible Team Members

- UI/UX Testing: [Name]
- Functionality Testing: [Name]
- Performance Testing: [Name]
- Accessibility Testing: [Name] 