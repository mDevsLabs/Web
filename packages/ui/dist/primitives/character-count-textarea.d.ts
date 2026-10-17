import { type TextareaHTMLAttributes } from 'react';
export interface CharacterCountTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
}
export declare function CharacterCountTextarea({ label, value, onValueChange, maxLength, id: givenId, 'aria-describedby': describedBy, className, ...props }: CharacterCountTextareaProps): import("react").JSX.Element;
