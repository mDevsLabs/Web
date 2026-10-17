import { type DomainFrameProps } from '../../internal/domain.js';
import type { InventorySettingsValues } from './types.js';
export interface InventorySettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: InventorySettingsValues;
    onChange: (key: keyof InventorySettingsValues, value: boolean) => void;
}
export declare function InventorySettings({ onChange, ...props }: InventorySettingsProps): import("react").JSX.Element;
