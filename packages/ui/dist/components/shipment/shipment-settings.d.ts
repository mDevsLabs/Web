import { type DomainFrameProps } from '../../internal/domain.js';
import type { ShipmentSettingsValues } from './types.js';
export interface ShipmentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ShipmentSettingsValues;
    onChange: (key: keyof ShipmentSettingsValues, value: boolean) => void;
}
export declare function ShipmentSettings({ onChange, ...props }: ShipmentSettingsProps): import("react").JSX.Element;
