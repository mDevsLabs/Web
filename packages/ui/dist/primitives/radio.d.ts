import { type InputHTMLAttributes } from 'react';
export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: string;
}
export declare function Radio({ label, className, id, ...props }: RadioProps): import("react").JSX.Element;
