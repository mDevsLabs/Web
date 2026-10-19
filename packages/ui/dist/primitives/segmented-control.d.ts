export interface SegmentedControlProps {
    value: string;
    onValueChange: (value: string) => void;
    options: readonly {
        value: string;
        label: string;
        disabled?: boolean;
    }[];
    label: string;
}
export declare function SegmentedControl({ value, onValueChange, options, label }: SegmentedControlProps): import("react").JSX.Element;
