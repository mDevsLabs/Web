import { type DomainFrameProps } from '../../internal/domain.js';
import type { CouponActivity } from './types.js';
export interface CouponTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly CouponActivity[];
    emptyMessage?: string;
}
export declare function CouponTimeline(props: CouponTimelineProps): import("react").JSX.Element;
