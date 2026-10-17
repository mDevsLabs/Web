export interface TagInputProps {
    value: readonly string[];
    onValueChange: (tags: string[]) => void;
    label: string;
    placeholder?: string;
}
export declare function TagInput({ value, onValueChange, label, placeholder }: TagInputProps): import("react").JSX.Element;
