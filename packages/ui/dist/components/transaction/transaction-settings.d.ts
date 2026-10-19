import { type DomainFrameProps } from '../../internal/domain.js';
import type { TransactionSettingsValues } from './types.js';
export interface TransactionSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: TransactionSettingsValues;
    onChange: (key: keyof TransactionSettingsValues, value: boolean) => void;
}
export declare function TransactionSettings({ onChange, ...props }: TransactionSettingsProps): import("react").JSX.Element;
