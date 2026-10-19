import { type HTMLAttributes } from 'react';
export interface StepperProps extends HTMLAttributes<HTMLOListElement> {
    steps: readonly string[];
    currentStep: number;
}
export declare function Stepper({ steps, currentStep, className, ...props }: StepperProps): import("react").JSX.Element;
