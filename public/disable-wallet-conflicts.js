/**
 * This script prevents conflicts with crypto wallet browser extensions
 * by catching attempts to modify the window.ethereum property
 */
(function() {
  // Only run this code in production environments to prevent conflicts
  if (window.location.hostname.includes('localhost')) return;

  try {
    // Create a dummy ethereum object if not exists
    if (!window.ethereum) {
      // Create an empty ethereum object to prevent extensions from overwriting it
      Object.defineProperty(window, 'ethereum', {
        value: {
          isPreventedByWorkoutApp: true,
          isMetaMask: false,
          isConnected: () => false,
          request: () => Promise.reject(new Error('Ethereum provider disabled in this app'))
        },
        writable: false,
        configurable: false
      });

      console.log('Workout app: Prevented wallet extension conflicts');
    }
  } catch (e) {
    console.log('Workout app: Failed to prevent wallet conflicts', e);
  }
})(); 