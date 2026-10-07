import { type DomainFrameProps } from '../../internal/domain.js';
import type { GiftCardSettingsValues } from './types.js';
export interface GiftCardSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: GiftCardSettingsValues;
    onChange: (key: keyof GiftCardSettingsValues, value: boolean) => void;
}
export declare function GiftCardSettings({ onChange, ...props }: GiftCardSettingsProps): import("react").JSX.Element;
