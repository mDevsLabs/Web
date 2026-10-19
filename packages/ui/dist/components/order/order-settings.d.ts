import { type DomainFrameProps } from '../../internal/domain.js';
import type { OrderSettingsValues } from './types.js';
export interface OrderSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: OrderSettingsValues;
    onChange: (key: keyof OrderSettingsValues, value: boolean) => void;
}
export declare function OrderSettings({ onChange, ...props }: OrderSettingsProps): import("react").JSX.Element;
