# Workout Tracker Browserbase Tests

This directory contains automated tests for the Workout Tracker application using Browserbase. The tests focus on verifying the functionality of the recent improvements to the workout coach chat interface.

## Test Coverage

The tests cover the following areas:

1. **Workout ID Recognition** - Tests the ability to recognize workout IDs with different formats, handling spaces, and fuzzy matching.
2. **Mode Toggle** - Tests the functionality of toggling between advice and modification modes, including UI changes and persistence.
3. **Visualization Enhancements** - Tests the improvements to workout change visualization, including exercise name display and indicators.

## Prerequisites

- Node.js (v14 or later)
- npm
- Browserbase

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Make sure the Workout Tracker application is running locally:
   ```
   cd ../../
   npm run dev
   ```

## Running Tests

### Run all tests:

```
npm run test:all
```

### Run specific test suites:

```
npm run test:id-recognition   # Test workout ID recognition
npm run test:mode-toggle      # Test mode toggle functionality
npm run test:visualization    # Test visualization enhancements
```

## Test Results

Test results will be displayed in the console, with each test reporting whether it passed or failed. A summary of passed and failed tests will be shown at the end of each test run.

## Test Structure

Each test file follows a similar structure:

1. **Helper functions** - Functions for common operations like waiting for application load, toggling modes, etc.
2. **Individual test functions** - Functions for each specific test case
3. **Main test runner** - Function that runs all tests and reports results

## Adding New Tests

To add a new test:

1. Create a new test function in the appropriate test file
2. Add the function to the `results` array in the `runAllTests()` function
3. Run the tests to verify your new test works as expected

## Troubleshooting

- If tests fail with element not found errors, check that the selectors used in the tests match the actual DOM elements in the application.
- Make sure the application is running on `http://localhost:3000` before starting the tests.
- If a test consistently fails, try increasing the wait times to allow for slower responses. 