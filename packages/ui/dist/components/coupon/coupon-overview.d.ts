import { type DomainFrameProps } from '../../internal/domain.js';
import type { Coupon, CouponMetric } from './types.js';
export interface CouponOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Coupon[];
    metrics: readonly CouponMetric[];
}
export declare function CouponOverview(props: CouponOverviewProps): import("react").JSX.Element;
