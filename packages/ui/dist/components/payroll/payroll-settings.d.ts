import { type DomainFrameProps } from '../../internal/domain.js';
import type { PayrollSettingsValues } from './types.js';
export interface PayrollSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: PayrollSettingsValues;
    onChange: (key: keyof PayrollSettingsValues, value: boolean) => void;
}
export declare function PayrollSettings({ onChange, ...props }: PayrollSettingsProps): import("react").JSX.Element;
