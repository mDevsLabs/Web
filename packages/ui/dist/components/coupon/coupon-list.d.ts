import { type DomainFrameProps } from '../../internal/domain.js';
import type { Coupon } from './types.js';
export interface CouponListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Coupon[];
    onSelect?: (item: Coupon) => void;
    emptyMessage?: string;
}
export declare function CouponList({ onSelect, ...props }: CouponListProps): import("react").JSX.Element;
