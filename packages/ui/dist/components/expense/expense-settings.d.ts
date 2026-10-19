import { type DomainFrameProps } from '../../internal/domain.js';
import type { ExpenseSettingsValues } from './types.js';
export interface ExpenseSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ExpenseSettingsValues;
    onChange: (key: keyof ExpenseSettingsValues, value: boolean) => void;
}
export declare function ExpenseSettings({ onChange, ...props }: ExpenseSettingsProps): import("react").JSX.Element;
