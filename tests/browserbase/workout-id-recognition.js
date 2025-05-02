/**
 * Workout ID Recognition Tests using Browserbase
 * 
 * This file contains automated tests for the workout ID recognition feature,
 * covering standard formats, IDs with spaces, fuzzy matching, and error handling.
 */

// Function to wait for the application to load
async function waitForAppLoad() {
  await wait('.coach-chat-container');
  console.log('Application loaded');
}

// Function to toggle to modification mode
async function toggleToModificationMode() {
  await click('.mode-toggle-button');
  await wait(1000); // Wait for mode to change
  console.log('Switched to modification mode');
}

// Function to send a message in the chat
async function sendMessage(message) {
  await fillText('input.chat-input', message);
  await click('button[type="submit"]');
  await wait(2000); // Wait for response
  console.log(`Sent message: ${message}`);
}

// Function to check if an element with specific text exists
async function checkForTextExists(text) {
  const bodyText = await getBodyText();
  return bodyText.includes(text);
}

// Main test for standard format workout ID (ID-01)
async function testStandardWorkoutID() {
  console.log('Running test ID-01: Standard format workout ID');
  
  await sendMessage('modify workout ID: upper_body_a');
  
  // Check if the system successfully identified the workout
  const success = await checkForTextExists('I\'ve analyzed your workout');
  
  if (success) {
    console.log('✅ TEST PASSED: System successfully identified standard workout ID');
  } else {
    console.log('❌ TEST FAILED: System did not identify standard workout ID');
  }
  
  return success;
}

// Test for workout ID with spaces (ID-02)
async function testWorkoutIDWithSpaces() {
  console.log('Running test ID-02: Workout ID with spaces');
  
  await sendMessage('modify UPPER BODY B workout');
  
  // Check if the system successfully identified the workout
  const success = await checkForTextExists('I\'ve analyzed your workout');
  
  if (success) {
    console.log('✅ TEST PASSED: System successfully identified workout ID with spaces');
  } else {
    console.log('❌ TEST FAILED: System did not identify workout ID with spaces');
  }
  
  return success;
}

// Test for natural language variation (ID-03)
async function testNaturalLanguageVariation() {
  console.log('Running test ID-03: Natural language variation');
  
  await sendMessage('I want to change my Upper Body B workout');
  
  // Check if the system successfully identified the workout
  const success = await checkForTextExists('I\'ve analyzed your workout');
  
  if (success) {
    console.log('✅ TEST PASSED: System successfully identified workout from natural language');
  } else {
    console.log('❌ TEST FAILED: System did not identify workout from natural language');
  }
  
  return success;
}

// Test for slightly misspelled workout ID (ID-04)
async function testMisspelledWorkoutID() {
  console.log('Running test ID-04: Misspelled workout ID');
  
  await sendMessage('modify Uper Boody B');
  
  // Check if the system suggests the correct workout
  const suggestion = await checkForTextExists('Did you mean "UPPER BODY B"');
  
  if (suggestion) {
    console.log('✅ TEST PASSED: System suggested correct workout for misspelled ID');
  } else {
    console.log('❌ TEST FAILED: System did not suggest correction for misspelled ID');
  }
  
  return suggestion;
}

// Test for non-existent workout ID (ID-05)
async function testNonExistentWorkoutID() {
  console.log('Running test ID-05: Non-existent workout ID');
  
  await sendMessage('modify XYZ workout');
  
  // Check if the system shows helpful error with workout suggestions
  const helpfulError = await checkForTextExists('I couldn\'t find a workout');
  const suggestions = await checkForTextExists('Available workouts are') || 
                     await checkForTextExists('list workouts');
  
  if (helpfulError && suggestions) {
    console.log('✅ TEST PASSED: System showed helpful error with suggestions');
  } else {
    console.log('❌ TEST FAILED: System did not show proper error guidance');
  }
  
  return helpfulError && suggestions;
}

// Main test runner
async function runAllTests() {
  try {
    console.log('Starting workout ID recognition tests...');
    
    // Navigate to the app
    await navigate('http://localhost:3000/coach');
    await waitForAppLoad();
    
    // Switch to modification mode for all tests
    await toggleToModificationMode();
    
    // Run all tests
    const results = [
      await testStandardWorkoutID(),
      await testWorkoutIDWithSpaces(),
      await testNaturalLanguageVariation(),
      await testMisspelledWorkoutID(),
      await testNonExistentWorkoutID()
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