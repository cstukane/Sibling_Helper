// Simple PIN management utility
class PinManager {
  private static PIN_KEY = 'parent_pin';
  
  // Set the parent PIN (in a real app, this should be properly secured)
  setPin(pin: string): void {
    localStorage.setItem(PinManager.PIN_KEY, pin);
  }
  
  // Check if a PIN is set
  isPinSet(): boolean {
    return !!localStorage.getItem(PinManager.PIN_KEY);
  }
  
  // Validate a PIN
  validatePin(pin: string): boolean {
    const storedPin = localStorage.getItem(PinManager.PIN_KEY);
    return storedPin === pin;
  }
  
  // Clear the PIN
  clearPin(): void {
    localStorage.removeItem(PinManager.PIN_KEY);
  }
  
  // Initialize with a default PIN if none exists
  initializeDefaultPin(): void {
    if (!this.isPinSet()) {
      this.setPin('1234'); // Default PIN for development
    }
  }
}

export const pinManager = new PinManager();