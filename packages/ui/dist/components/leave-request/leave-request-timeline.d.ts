import { type DomainFrameProps } from '../../internal/domain.js';
import type { LeaveRequestActivity } from './types.js';
export interface LeaveRequestTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly LeaveRequestActivity[];
    emptyMessage?: string;
}
export declare function LeaveRequestTimeline(props: LeaveRequestTimelineProps): import("react").JSX.Element;
