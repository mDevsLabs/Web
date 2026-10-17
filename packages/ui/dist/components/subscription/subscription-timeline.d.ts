import { type DomainFrameProps } from '../../internal/domain.js';
import type { SubscriptionActivity } from './types.js';
export interface SubscriptionTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly SubscriptionActivity[];
    emptyMessage?: string;
}
export declare function SubscriptionTimeline(props: SubscriptionTimelineProps): import("react").JSX.Element;
