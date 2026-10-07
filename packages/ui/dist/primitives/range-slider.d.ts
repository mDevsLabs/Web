import { type InputHTMLAttributes } from 'react';
export interface RangeSliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: string;
}
export declare function RangeSlider({ label, id, className, ...props }: RangeSliderProps): import("react").JSX.Element;
