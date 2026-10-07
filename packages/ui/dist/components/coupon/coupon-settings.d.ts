import { type DomainFrameProps } from '../../internal/domain.js';
import type { CouponSettingsValues } from './types.js';
export interface CouponSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CouponSettingsValues;
    onChange: (key: keyof CouponSettingsValues, value: boolean) => void;
}
export declare function CouponSettings({ onChange, ...props }: CouponSettingsProps): import("react").JSX.Element;
