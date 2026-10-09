import { type DomainFrameProps } from '../../internal/domain.js';
import type { Coupon } from './types.js';
export interface CouponTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Coupon[];
    emptyMessage?: string;
}
export declare function CouponTable(props: CouponTableProps): import("react").JSX.Element;
