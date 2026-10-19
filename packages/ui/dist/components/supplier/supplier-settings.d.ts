import { type DomainFrameProps } from '../../internal/domain.js';
import type { SupplierSettingsValues } from './types.js';
export interface SupplierSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: SupplierSettingsValues;
    onChange: (key: keyof SupplierSettingsValues, value: boolean) => void;
}
export declare function SupplierSettings({ onChange, ...props }: SupplierSettingsProps): import("react").JSX.Element;
