import { type DomainFrameProps } from '../../internal/domain.js';
import type { CheckoutSettingsValues } from './types.js';
export interface CheckoutSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CheckoutSettingsValues;
    onChange: (key: keyof CheckoutSettingsValues, value: boolean) => void;
}
export declare function CheckoutSettings({ onChange, ...props }: CheckoutSettingsProps): import("react").JSX.Element;
