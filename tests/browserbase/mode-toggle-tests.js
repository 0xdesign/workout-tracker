/**
 * Mode Toggle Tests using Browserbase
 * 
 * This file contains automated tests for the mode toggle feature,
 * covering UI changes, persistence, and input placeholder updates.
 */

// Function to wait for the application to load
async function waitForAppLoad() {
  await wait('.coach-chat-container');
  console.log('Application loaded');
}

// Function to check if the app is in the specified mode
async function isInMode(mode) {
  const modeText = await getElementText('.text-sm.font-medium.text-white');
  return modeText.includes(mode === 'advice' ? 'Advice' : 'Modification');
}

// Function to check border color
async function checkBorderColor(mode) {
  // This is an estimation using class presence, would need a more robust solution in production
  const container = await getElement('.flex.flex-col.h-full');
  const classes = await getElementAttribute(container, 'class');
  
  if (mode === 'advice') {
    return classes.includes('border-[#383838]');
  } else {
    return classes.includes('border-[#FC2B4E]');
  }
}

// Function to check input placeholder
async function checkInputPlaceholder(mode) {
  const placeholder = await getElementAttribute('input.chat-input', 'placeholder');
  
  if (mode === 'advice') {
    return placeholder.includes('Ask for workout advice');
  } else {
    return placeholder.includes('list workouts') || placeholder.includes('modification request');
  }
}

// Test for toggling from advice to modification mode (MT-01)
async function testToggleToModificationMode() {
  console.log('Running test MT-01: Toggle from advice to modification mode');
  
  // Ensure we're in advice mode
  const initialMode = await isInMode('advice');
  if (!initialMode) {
    console.log('Not in advice mode initially, attempting to switch...');
    await click('.mode-toggle-button');
    await wait(1000);
  }
  
  // Now toggle to modification mode
  await click('.mode-toggle-button');
  await wait(1000);
  
  // Check if the mode changed correctly
  const inModificationMode = await isInMode('modification');
  const correctBorderColor = await checkBorderColor('modification');
  const correctPlaceholder = await checkInputPlaceholder('modification');
  
  const success = inModificationMode && correctBorderColor && correctPlaceholder;
  
  if (success) {
    console.log('✅ TEST PASSED: Successfully toggled to modification mode with correct UI changes');
  } else {
    console.log('❌ TEST FAILED: Could not verify correct toggle to modification mode');
    console.log(`- In modification mode: ${inModificationMode}`);
    console.log(`- Border color correct: ${correctBorderColor}`);
    console.log(`- Placeholder correct: ${correctPlaceholder}`);
  }
  
  return success;
}

// Test for toggling from modification to advice mode (MT-02)
async function testToggleToAdviceMode() {
  console.log('Running test MT-02: Toggle from modification to advice mode');
  
  // Ensure we're in modification mode
  const initialMode = await isInMode('modification');
  if (!initialMode) {
    console.log('Not in modification mode initially, attempting to switch...');
    await click('.mode-toggle-button');
    await wait(1000);
  }
  
  // Now toggle to advice mode
  await click('.mode-toggle-button');
  await wait(1000);
  
  // Check if the mode changed correctly
  const inAdviceMode = await isInMode('advice');
  const correctBorderColor = await checkBorderColor('advice');
  const correctPlaceholder = await checkInputPlaceholder('advice');
  
  const success = inAdviceMode && correctBorderColor && correctPlaceholder;
  
  if (success) {
    console.log('✅ TEST PASSED: Successfully toggled to advice mode with correct UI changes');
  } else {
    console.log('❌ TEST FAILED: Could not verify correct toggle to advice mode');
    console.log(`- In advice mode: ${inAdviceMode}`);
    console.log(`- Border color correct: ${correctBorderColor}`);
    console.log(`- Placeholder correct: ${correctPlaceholder}`);
  }
  
  return success;
}

// Test for mode persistence (MT-03)
async function testModePersistence() {
  console.log('Running test MT-03: Mode persistence across page refreshes');
  
  // Set to modification mode
  const initialMode = await isInMode('modification');
  if (!initialMode) {
    console.log('Setting to modification mode for persistence test...');
    await click('.mode-toggle-button');
    await wait(1000);
  }
  
  // Verify we're in modification mode
  const inModificationMode = await isInMode('modification');
  
  // Refresh the page
  await navigate('http://localhost:3000/coach');
  await waitForAppLoad();
  
  // Check if still in modification mode after refresh
  const stillInModificationMode = await isInMode('modification');
  
  if (inModificationMode && stillInModificationMode) {
    console.log('✅ TEST PASSED: Mode persisted through page refresh');
  } else {
    console.log('❌ TEST FAILED: Mode did not persist after page refresh');
  }
  
  return inModificationMode && stillInModificationMode;
}

// Main test runner
async function runAllTests() {
  try {
    console.log('Starting mode toggle tests...');
    
    // Navigate to the app
    await navigate('http://localhost:3000/coach');
    await waitForAppLoad();
    
    // Run all tests
    const results = [
      await testToggleToModificationMode(),
      await testToggleToAdviceMode(),
      await testModePersistence()
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