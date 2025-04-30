/**
 * This script prevents conflicts with crypto wallet browser extensions
 * by catching attempts to modify the window.ethereum property
 */
(function() {
  // Only run this code in production environments to prevent conflicts
  if (window.location.hostname.includes('localhost')) return;

  try {
    // Create a dummy ethereum object
    var dummyEthereum = {
      isPreventedByWorkoutApp: true,
      isMetaMask: false,
      isConnected: function() { return false; },
      request: function() { return Promise.reject(new Error('Ethereum provider disabled in this app')); }
    };

    // Define ethereum with a getter that always returns our dummy object
    Object.defineProperty(window, 'ethereum', {
      configurable: false,
      enumerable: true,
      get: function() { return dummyEthereum; },
      set: function() { return dummyEthereum; } // Ignore attempts to set
    });

    // Also block common wallet objects to prevent other injection attempts
    var walletObjects = ['solana', 'solflare', 'phantom', 'backpack'];
    walletObjects.forEach(function(name) {
      if (!window[name]) {
        Object.defineProperty(window, name, {
          configurable: false,
          enumerable: true,
          get: function() { return { isDisabled: true }; },
          set: function() { return { isDisabled: true }; }
        });
      }
    });

    console.log('Workout app: Prevented wallet extension conflicts');
    
    // Block any attempts to redefine ethereum via browser native methods
    var originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj, prop, descriptor) {
      if (obj === window && (prop === 'ethereum' || walletObjects.includes(prop))) {
        console.log('Workout app: Blocked attempt to redefine ' + prop);
        return obj;
      }
      return originalDefineProperty.call(this, obj, prop, descriptor);
    };
    
    var originalDefineProperties = Object.defineProperties;
    Object.defineProperties = function(obj, props) {
      if (obj === window) {
        if (props.ethereum) {
          console.log('Workout app: Blocked attempt to redefine ethereum via defineProperties');
          delete props.ethereum;
        }
        walletObjects.forEach(function(name) {
          if (props[name]) {
            console.log('Workout app: Blocked attempt to redefine ' + name + ' via defineProperties');
            delete props[name];
          }
        });
      }
      return originalDefineProperties.call(this, obj, props);
    };
  } catch (e) {
    console.log('Workout app: Failed to prevent wallet conflicts', e);
  }
})(); 