import { type DomainFrameProps } from '../../internal/domain.js';
import type { BookingActivity } from './types.js';
export interface BookingTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly BookingActivity[];
    emptyMessage?: string;
}
export declare function BookingTimeline(props: BookingTimelineProps): import("react").JSX.Element;
