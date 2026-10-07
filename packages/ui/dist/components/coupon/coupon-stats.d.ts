import { type DomainFrameProps } from '../../internal/domain.js';
import type { CouponMetric } from './types.js';
export interface CouponStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly CouponMetric[];
}
export declare function CouponStats(props: CouponStatsProps): import("react").JSX.Element;
