import { useEffect, useState, useRef, useCallback } from 'react';

export function useLocalStorageValue(key: string, defaultValue: string = '') {
    const [value, setValue] = useState<string>(defaultValue);
    const [isInitialized, setIsInitialized] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const storedValue = localStorage.getItem(key);
        if (storedValue !== null) {
            setValue(storedValue);
        }
        setIsInitialized(true);
    }, [key]);

    // Debounced localStorage write to reduce unnecessary writes
    useEffect(() => {
        if (isInitialized) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                localStorage.setItem(key, value);
            }, 300); // 300ms debounce
        }
        
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [key, value, isInitialized]);

    const setDebouncedValue = useCallback((newValue: string | ((prev: string) => string)) => {
        setValue(prev => {
            const updatedValue = typeof newValue === 'function' ? newValue(prev) : newValue;
            return updatedValue;
        });
    }, []);

    return [value, setDebouncedValue] as const;
}
