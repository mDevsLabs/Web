import { type DomainFrameProps } from '../../internal/domain.js';
import type { PaymentSettingsValues } from './types.js';
export interface PaymentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: PaymentSettingsValues;
    onChange: (key: keyof PaymentSettingsValues, value: boolean) => void;
}
export declare function PaymentSettings({ onChange, ...props }: PaymentSettingsProps): import("react").JSX.Element;
