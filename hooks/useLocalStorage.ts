// FIX: Import React to resolve 'Cannot find namespace React' error.
import React, { useState } from 'react';

// This hook is designed to synchronize a React state with the browser's localStorage.
// It uses a lazy initializer for useState to read from localStorage only on the initial render,
// preventing unnecessary reads on subsequent re-renders.
export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  
  // The state is initialized with a function, which React will only execute on the initial render.
  const [storedValue, setStoredValue] = useState<T>(() => {
    // This code does not run on the server.
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      // Attempt to get the stored item by key.
      const item = window.localStorage.getItem(key);
      // Parse the stored JSON, or if it doesn't exist, use the initialValue.
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      // If parsing fails, log the error and default to the initialValue.
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  // This function is a wrapper around the state setter. It updates both
  // the component's state and the localStorage.
  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      // Use the updater function form of the state setter to ensure we're working with the latest state.
      // This prevents issues with stale closures.
      setStoredValue(prevState => {
        // The value can be a new value or a function to update the existing value,
        // mimicking the behavior of useState's setter.
        const valueToStore = value instanceof Function ? value(prevState) : value;
        
        // Persist the new value to localStorage, again ensuring this only runs client-side.
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        
        return valueToStore;
      });
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  };

  return [storedValue, setValue];
}