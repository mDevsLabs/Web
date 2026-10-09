import { type DomainFrameProps } from '../../internal/domain.js';
import type { EmployeeSettingsValues } from './types.js';
export interface EmployeeSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: EmployeeSettingsValues;
    onChange: (key: keyof EmployeeSettingsValues, value: boolean) => void;
}
export declare function EmployeeSettings({ onChange, ...props }: EmployeeSettingsProps): import("react").JSX.Element;
