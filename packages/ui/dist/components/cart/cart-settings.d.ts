import { type DomainFrameProps } from '../../internal/domain.js';
import type { CartSettingsValues } from './types.js';
export interface CartSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CartSettingsValues;
    onChange: (key: keyof CartSettingsValues, value: boolean) => void;
}
export declare function CartSettings({ onChange, ...props }: CartSettingsProps): import("react").JSX.Element;
