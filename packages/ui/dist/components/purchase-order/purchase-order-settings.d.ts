import { type DomainFrameProps } from '../../internal/domain.js';
import type { PurchaseOrderSettingsValues } from './types.js';
export interface PurchaseOrderSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: PurchaseOrderSettingsValues;
    onChange: (key: keyof PurchaseOrderSettingsValues, value: boolean) => void;
}
export declare function PurchaseOrderSettings({ onChange, ...props }: PurchaseOrderSettingsProps): import("react").JSX.Element;
