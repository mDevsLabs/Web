import { type DomainFrameProps } from '../../internal/domain.js';
import type { BankAccountSettingsValues } from './types.js';
export interface BankAccountSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: BankAccountSettingsValues;
    onChange: (key: keyof BankAccountSettingsValues, value: boolean) => void;
}
export declare function BankAccountSettings({ onChange, ...props }: BankAccountSettingsProps): import("react").JSX.Element;
