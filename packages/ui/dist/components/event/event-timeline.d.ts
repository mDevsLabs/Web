import { type DomainFrameProps } from '../../internal/domain.js';
import type { EventActivity } from './types.js';
export interface EventTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly EventActivity[];
    emptyMessage?: string;
}
export declare function EventTimeline(props: EventTimelineProps): import("react").JSX.Element;
