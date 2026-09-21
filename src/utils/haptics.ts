/**
 * Tactile haptic feedback utility for mobile and touch devices
 */
export type HapticType = 'light' | 'medium' | 'success' | 'celebration';

export function triggerHaptic(type: HapticType = 'light'): void {
  if (typeof window === 'undefined' || !window.navigator || !window.navigator.vibrate) {
    return;
  }

  try {
    switch (type) {
      case 'light':
        window.navigator.vibrate(12);
        break;
      case 'medium':
        window.navigator.vibrate(25);
        break;
      case 'success':
        window.navigator.vibrate([15, 35, 25]);
        break;
      case 'celebration':
        window.navigator.vibrate([30, 45, 30, 45, 60]);
        break;
    }
  } catch (err) {
    // Ignore devices that block vibration without user gesture
  }
}
