/**
 * Visualization Enhancement Tests using Browserbase
 * 
 * This file contains automated tests for the workout change visualization enhancements,
 * covering exercise name display, change indicators, before/after comparisons, and formatting.
 */

// Function to wait for the application to load
async function waitForAppLoad() {
  await wait('.coach-chat-container');
  console.log('Application loaded');
}

// Function to toggle to modification mode
async function toggleToModificationMode() {
  const modeText = await getElementText('.text-sm.font-medium.text-white');
  if (!modeText.includes('Modification')) {
    await click('.mode-toggle-button');
    await wait(1000); // Wait for mode to change
  }
  console.log('Switched to modification mode');
}

// Function to send a message in the chat
async function sendMessage(message) {
  await fillText('input.chat-input', message);
  await click('button[type="submit"]');
  await wait(2000); // Wait for response
  console.log(`Sent message: ${message}`);
}

// Function to trigger a workout modification proposal
async function triggerWorkoutModification() {
  // Use a workout ID that definitely exists in the system
  await sendMessage('modify UPPER BODY A workout');
  await wait(3000); // Wait for AI to generate the proposal
  
  // Check if a workout proposal was generated
  const proposalExists = await elementExists('.workout-change-proposal') || 
                         await elementExists('[class*="WorkoutChangeProposal"]');
                         
  if (!proposalExists) {
    console.log('No workout proposal was generated. Trying again with different ID...');
    await sendMessage('list workouts');
    await wait(2000);
    
    // Try to find a workout in the list and select it
    const workoutButtons = await getElements('button[class*="workout-selector"]');
    if (workoutButtons && workoutButtons.length > 0) {
      await click(workoutButtons[0]);
      await wait(1000);
      await sendMessage('Increase the weight for chest press by 5 pounds');
      await wait(3000);
    } else {
      console.log('Could not find workout list or selector buttons');
    }
  }
  
  return await elementExists('.workout-change-proposal') || 
         await elementExists('[class*="WorkoutChangeProposal"]');
}

// Test for exercise names display (VE-01)
async function testExerciseNamesDisplay() {
  console.log('Running test VE-01: Exercise names display');
  
  // First ensure we have a workout proposal
  const hasProposal = await triggerWorkoutModification();
  if (!hasProposal) {
    console.log('❌ TEST FAILED: Could not generate a workout proposal');
    return false;
  }
  
  // Check if exercise names are displayed
  const exerciseNames = await elementExists('.text-sm.font-medium.text-white');
  
  if (exerciseNames) {
    console.log('✅ TEST PASSED: Exercise names are displayed with proposals');
  } else {
    console.log('❌ TEST FAILED: Exercise names are not displayed with proposals');
  }
  
  return exerciseNames;
}

// Test for visual change indicators (VE-02)
async function testVisualChangeIndicators() {
  console.log('Running test VE-02: Visual change indicators');
  
  // Look for increase/decrease indicators
  const increaseIndicator = await elementExists('[class*="text-green-500"]');
  const decreaseIndicator = await elementExists('[class*="text-amber-500"]');
  const neutralIndicator = await elementExists('[class*="text-blue-400"]');
  
  const hasIndicators = increaseIndicator || decreaseIndicator || neutralIndicator;
  
  if (hasIndicators) {
    console.log('✅ TEST PASSED: Visual change indicators are present');
  } else {
    console.log('❌ TEST FAILED: Visual change indicators are not present');
  }
  
  return hasIndicators;
}

// Test for before/after comparison (VE-03)
async function testBeforeAfterComparison() {
  console.log('Running test VE-03: Before/after comparison');
  
  // Check for current value and proposed change sections
  const currentValueElements = await elementExists('[class*="Current Value"]');
  const proposedChangeElements = await elementExists('[class*="Proposed Change"]');
  
  const hasComparison = currentValueElements && proposedChangeElements;
  
  if (hasComparison) {
    console.log('✅ TEST PASSED: Before/after comparison is clearly displayed');
  } else {
    console.log('❌ TEST FAILED: Before/after comparison is not clearly displayed');
  }
  
  return hasComparison;
}

// Test for impact summaries (VE-04)
async function testImpactSummaries() {
  console.log('Running test VE-04: Impact summaries');
  
  // Check for impact summary section
  const impactSummary = await elementExists('[class*="Expected Impact"]');
  
  if (impactSummary) {
    console.log('✅ TEST PASSED: Impact summaries are displayed');
  } else {
    console.log('❌ TEST FAILED: Impact summaries are not displayed');
  }
  
  return impactSummary;
}

// Test for formatting with units (VE-05)
async function testFormattingWithUnits() {
  console.log('Running test VE-05: Formatting with units');
  
  // Check for weight values with units
  const bodyText = await getBodyText();
  const hasUnits = bodyText.includes(' lbs') || bodyText.includes(' kg');
  
  if (hasUnits) {
    console.log('✅ TEST PASSED: Values are formatted with appropriate units');
  } else {
    console.log('❌ TEST FAILED: Values do not have appropriate units');
  }
  
  return hasUnits;
}

// Main test runner
async function runAllTests() {
  try {
    console.log('Starting visualization enhancement tests...');
    
    // Navigate to the app
    await navigate('http://localhost:3000/coach');
    await waitForAppLoad();
    
    // Switch to modification mode for all tests
    await toggleToModificationMode();
    
    // Trigger a workout modification proposal
    const hasProposal = await triggerWorkoutModification();
    
    if (!hasProposal) {
      console.log('❌ TESTS FAILED: Could not generate a workout proposal for testing');
      return;
    }
    
    // Run all tests
    const results = [
      await testExerciseNamesDisplay(),
      await testVisualChangeIndicators(),
      await testBeforeAfterComparison(),
      await testImpactSummaries(),
      await testFormattingWithUnits()
    ];
    
    // Report results
    const passedTests = results.filter(result => result).length;
    console.log(`\nTEST SUMMARY: ${passedTests} out of ${results.length} tests passed`);
    
    if (passedTests === results.length) {
      console.log('✅ ALL TESTS PASSED');
    } else {
      console.log(`❌ ${results.length - passedTests} TESTS FAILED`);
    }
    
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run all tests
runAllTests(); 