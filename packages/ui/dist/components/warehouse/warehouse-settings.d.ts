import { type DomainFrameProps } from '../../internal/domain.js';
import type { WarehouseSettingsValues } from './types.js';
export interface WarehouseSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: WarehouseSettingsValues;
    onChange: (key: keyof WarehouseSettingsValues, value: boolean) => void;
}
export declare function WarehouseSettings({ onChange, ...props }: WarehouseSettingsProps): import("react").JSX.Element;
