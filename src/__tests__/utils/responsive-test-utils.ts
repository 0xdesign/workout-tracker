/**
 * Utility functions for testing responsive behavior
 */

// Add simple test to make Jest happy
describe('Responsive Test Utilities', () => {
  it('exists and can be imported', () => {
    expect(viewports).toBeDefined();
  });
});

/**
 * Standard viewport sizes for testing
 */
export const viewports = {
  mobile: {
    width: 375,
    height: 667
  },
  tablet: {
    width: 768,
    height: 1024
  },
  desktop: {
    width: 1366,
    height: 768
  }
};

// Store original viewport dimensions to restore later
let originalWidth: number;
let originalHeight: number;

if (typeof window !== 'undefined') {
  originalWidth = window.innerWidth;
  originalHeight = window.innerHeight;
}

/**
 * Sets the viewport size for testing responsive components
 * @param width - Viewport width in pixels
 * @param height - Viewport height in pixels
 */
export function setViewport(width: number, height: number): void {
  if (typeof window === 'undefined') return;
  
  // Update viewport dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  });
  
  // Mock window.matchMedia as it's used by many responsive components
  window.matchMedia = jest.fn().mockImplementation(query => {
    return {
      matches: width <= 768, // Mobile breakpoint for example
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  });
  
  // Dispatch resize event to trigger responsive handlers
  window.dispatchEvent(new Event('resize'));
}

/**
 * Sets the viewport to a standard size by name
 * @param size - 'mobile', 'tablet', or 'desktop'
 */
export function setStandardViewport(size: 'mobile' | 'tablet' | 'desktop'): void {
  const viewport = viewports[size];
  setViewport(viewport.width, viewport.height);
}

/**
 * Restores the original viewport size after tests
 */
export function resetViewport(): void {
  if (typeof window === 'undefined') return;
  
  // Reset to original size if it was stored
  if (originalWidth && originalHeight) {
    setViewport(originalWidth, originalHeight);
  } else {
    // Otherwise reset to a standard size
    setViewport(1024, 768);
  }
}

/**
 * Simulates touch events for testing mobile interactions
 */
export const touchEvents = {
  /**
   * Simulates a touch start event
   * @param element - The DOM element to touch
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  start(element: Element, x: number, y: number): void {
    if (typeof window === 'undefined') return;
    
    const touchStartEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [
        new Touch({
          identifier: Date.now(),
          target: element as EventTarget,
          clientX: x,
          clientY: y,
          radiusX: 2.5,
          radiusY: 2.5,
          rotationAngle: 0,
          force: 1
        })
      ]
    });
    element.dispatchEvent(touchStartEvent);
  },
  
  /**
   * Simulates a touch move event
   * @param element - The DOM element to touch
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  move(element: Element, x: number, y: number): void {
    if (typeof window === 'undefined') return;
    
    const touchMoveEvent = new TouchEvent('touchmove', {
      bubbles: true,
      cancelable: true,
      touches: [
        new Touch({
          identifier: Date.now(),
          target: element as EventTarget,
          clientX: x,
          clientY: y,
          radiusX: 2.5,
          radiusY: 2.5,
          rotationAngle: 0,
          force: 1
        })
      ]
    });
    element.dispatchEvent(touchMoveEvent);
  },
  
  /**
   * Simulates a touch end event
   * @param element - The DOM element to touch
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  end(element: Element, x: number, y: number): void {
    if (typeof window === 'undefined') return;
    
    const touchEndEvent = new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      touches: [],
      changedTouches: [
        new Touch({
          identifier: Date.now(),
          target: element as EventTarget,
          clientX: x,
          clientY: y,
          radiusX: 2.5,
          radiusY: 2.5,
          rotationAngle: 0,
          force: 0
        })
      ]
    });
    element.dispatchEvent(touchEndEvent);
  },
  
  /**
   * Simulates a complete touch tap interaction
   * @param element - The DOM element to tap
   */
  tap(element: Element): void {
    if (typeof window === 'undefined') return;
    
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    this.start(element, centerX, centerY);
    this.end(element, centerX, centerY);
  },
  
  /**
   * Simulates a swipe gesture
   * @param element - The DOM element to swipe on
   * @param direction - 'left', 'right', 'up', or 'down'
   * @param distance - Distance to swipe in pixels
   */
  swipe(element: Element, direction: 'left' | 'right' | 'up' | 'down', distance: number = 100): void {
    if (typeof window === 'undefined') return;
    
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let startX: number, startY: number, endX: number, endY: number;
    
    switch (direction) {
      case 'left':
        startX = centerX + distance / 2;
        startY = centerY;
        endX = centerX - distance / 2;
        endY = centerY;
        break;
      case 'right':
        startX = centerX - distance / 2;
        startY = centerY;
        endX = centerX + distance / 2;
        endY = centerY;
        break;
      case 'up':
        startX = centerX;
        startY = centerY + distance / 2;
        endX = centerX;
        endY = centerY - distance / 2;
        break;
      case 'down':
        startX = centerX;
        startY = centerY - distance / 2;
        endX = centerX;
        endY = centerY + distance / 2;
        break;
    }
    
    this.start(element, startX, startY);
    
    // Simulate movement in small increments
    const steps = 5;
    const stepX = (endX - startX) / steps;
    const stepY = (endY - startY) / steps;
    
    for (let i = 1; i <= steps; i++) {
      const moveX = startX + stepX * i;
      const moveY = startY + stepY * i;
      this.move(element, moveX, moveY);
    }
    
    this.end(element, endX, endY);
  }
}; 