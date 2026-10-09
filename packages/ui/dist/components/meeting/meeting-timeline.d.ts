import { type DomainFrameProps } from '../../internal/domain.js';
import type { MeetingActivity } from './types.js';
export interface MeetingTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly MeetingActivity[];
    emptyMessage?: string;
}
export declare function MeetingTimeline(props: MeetingTimelineProps): import("react").JSX.Element;
