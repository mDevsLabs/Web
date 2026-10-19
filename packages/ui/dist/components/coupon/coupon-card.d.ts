import { type DomainFrameProps } from '../../internal/domain.js';
import type { Coupon } from './types.js';
export interface CouponCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Coupon;
}
export declare function CouponCard(props: CouponCardProps): import("react").JSX.Element;
