import { type DomainFrameProps } from '../../internal/domain.js';
import type { BudgetSettingsValues } from './types.js';
export interface BudgetSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: BudgetSettingsValues;
    onChange: (key: keyof BudgetSettingsValues, value: boolean) => void;
}
export declare function BudgetSettings({ onChange, ...props }: BudgetSettingsProps): import("react").JSX.Element;
