import { type DomainFrameProps } from '../../internal/domain.js';
import type { Coupon } from './types.js';
export interface CouponFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Coupon>;
    onSubmit: (value: Omit<Coupon, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function CouponForm({ onSubmit, ...props }: CouponFormProps): import("react").JSX.Element;
