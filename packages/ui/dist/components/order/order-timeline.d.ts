import { type DomainFrameProps } from '../../internal/domain.js';
import type { OrderActivity } from './types.js';
export interface OrderTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly OrderActivity[];
    emptyMessage?: string;
}
export declare function OrderTimeline(props: OrderTimelineProps): import("react").JSX.Element;
