import { type ComponentPropsWithoutRef } from 'react';
import { Switch as RSwitch } from 'radix-ui';
export interface SwitchProps extends ComponentPropsWithoutRef<typeof RSwitch.Root> {
    label: string;
}
export declare function Switch({ label, id, className, ...props }: SwitchProps): import("react").JSX.Element;
