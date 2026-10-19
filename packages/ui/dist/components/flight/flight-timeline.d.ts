import { type DomainFrameProps } from '../../internal/domain.js';
import type { FlightActivity } from './types.js';
export interface FlightTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly FlightActivity[];
    emptyMessage?: string;
}
export declare function FlightTimeline(props: FlightTimelineProps): import("react").JSX.Element;
