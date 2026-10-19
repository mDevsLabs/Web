import { type DomainFrameProps } from '../../internal/domain.js';
import type { LeadActivity } from './types.js';
export interface LeadTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly LeadActivity[];
    emptyMessage?: string;
}
export declare function LeadTimeline(props: LeadTimelineProps): import("react").JSX.Element;
