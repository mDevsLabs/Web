import { type DomainFrameProps } from '../../internal/domain.js';
import type { CustomerSettingsValues } from './types.js';
export interface CustomerSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CustomerSettingsValues;
    onChange: (key: keyof CustomerSettingsValues, value: boolean) => void;
}
export declare function CustomerSettings({ onChange, ...props }: CustomerSettingsProps): import("react").JSX.Element;
