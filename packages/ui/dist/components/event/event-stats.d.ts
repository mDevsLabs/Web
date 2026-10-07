import { type DomainFrameProps } from '../../internal/domain.js';
import type { EventMetric } from './types.js';
export interface EventStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly EventMetric[];
}
export declare function EventStats(props: EventStatsProps): import("react").JSX.Element;
