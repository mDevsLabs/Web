import { useState } from 'react';
export function cx(...values: Array<string | undefined | false | null>) {
    return values.filter(Boolean).join(' ');
}
export function useControllable<T>(value: T | undefined, fallback: T, onChange?: (next: T) => void) {
    const [internal, setInternal] = useState(fallback);
    const current = value === undefined ? internal : value;
    const update = (next: T) => {
        if (value === undefined)
            setInternal(next);
        onChange?.(next);
    };
    return [current, update] as const;
}
