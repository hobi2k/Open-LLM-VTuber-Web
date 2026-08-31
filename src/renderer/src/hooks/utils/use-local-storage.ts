import { useCallback, useState } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    filter?: (value: T) => T
  },
) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null || item === 'undefined') {
        if (item === 'undefined') window.localStorage.removeItem(key);
        return initialValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const filter = options?.filter;
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue((currentValue) => {
      try {
        const valueToStore = value instanceof Function ? value(currentValue) : value;
        const filteredValue = filter ? filter(valueToStore) : valueToStore;
        const serializedValue = JSON.stringify(filteredValue);
        if (serializedValue === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, serializedValue);
        }
        return valueToStore;
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
        return currentValue;
      }
    });
  }, [filter, key]);

  return [storedValue, setValue] as const;
}
