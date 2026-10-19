import { type DomainFrameProps } from '../../internal/domain.js';
import type { SupportTicketActivity } from './types.js';
export interface SupportTicketTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly SupportTicketActivity[];
    emptyMessage?: string;
}
export declare function SupportTicketTimeline(props: SupportTicketTimelineProps): import("react").JSX.Element;
