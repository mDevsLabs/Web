import { type DomainFrameProps } from '../../internal/domain.js';
import type { Subscription, SubscriptionMetric } from './types.js';
export interface SubscriptionOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Subscription[];
    metrics: readonly SubscriptionMetric[];
}
export declare function SubscriptionOverview(props: SubscriptionOverviewProps): import("react").JSX.Element;
