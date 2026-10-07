import { type DomainFrameProps } from '../../internal/domain.js';
import type { CalendarActivity } from './types.js';
export interface CalendarTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly CalendarActivity[];
    emptyMessage?: string;
}
export declare function CalendarTimeline(props: CalendarTimelineProps): import("react").JSX.Element;
