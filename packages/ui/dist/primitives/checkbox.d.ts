import { type ComponentPropsWithoutRef } from 'react';
import { Checkbox as RCheckbox } from 'radix-ui';
export interface CheckboxProps extends ComponentPropsWithoutRef<typeof RCheckbox.Root> {
    label: string;
}
export declare function Checkbox({ label, className, id, ...props }: CheckboxProps): import("react").JSX.Element;
