import { type DomainFrameProps } from '../../internal/domain.js';
import type { SubscriptionMetric } from './types.js';
export interface SubscriptionStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly SubscriptionMetric[];
}
export declare function SubscriptionStats(props: SubscriptionStatsProps): import("react").JSX.Element;
