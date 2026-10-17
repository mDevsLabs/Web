export interface RatingProps {
    value?: number;
    defaultValue?: number;
    onValueChange?: (value: number) => void;
    max?: number;
    label: string;
    disabled?: boolean;
}
export declare function Rating({ value, defaultValue, onValueChange, max, label, disabled }: RatingProps): import("react").JSX.Element;
