import { type HTMLAttributes } from 'react';
export interface NumberStepperProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: number;
    onValueChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
}
export declare function NumberStepper({ label, value, onValueChange, min, max, step, disabled, className, ...props }: NumberStepperProps): import("react").JSX.Element;
