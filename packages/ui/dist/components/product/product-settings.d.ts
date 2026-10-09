import { type DomainFrameProps } from '../../internal/domain.js';
import type { ProductSettingsValues } from './types.js';
export interface ProductSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ProductSettingsValues;
    onChange: (key: keyof ProductSettingsValues, value: boolean) => void;
}
export declare function ProductSettings({ onChange, ...props }: ProductSettingsProps): import("react").JSX.Element;
