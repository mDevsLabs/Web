export declare function cx(...values: Array<string | undefined | false | null>): string;
export declare function useControllable<T>(value: T | undefined, fallback: T, onChange?: (next: T) => void): readonly [T, (next: T) => void];
