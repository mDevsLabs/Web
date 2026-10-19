import { type DomainFrameProps } from '../../internal/domain.js';
import type { Event, EventMetric } from './types.js';
export interface EventOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Event[];
    metrics: readonly EventMetric[];
}
export declare function EventOverview(props: EventOverviewProps): import("react").JSX.Element;
