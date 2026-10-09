import { type DomainFrameProps } from '../../internal/domain.js';
import type { RestaurantMenuSettingsValues } from './types.js';
export interface RestaurantMenuSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: RestaurantMenuSettingsValues;
    onChange: (key: keyof RestaurantMenuSettingsValues, value: boolean) => void;
}
export declare function RestaurantMenuSettings({ onChange, ...props }: RestaurantMenuSettingsProps): import("react").JSX.Element;
