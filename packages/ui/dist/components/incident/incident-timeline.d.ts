import { type DomainFrameProps } from '../../internal/domain.js';
import type { IncidentActivity } from './types.js';
export interface IncidentTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly IncidentActivity[];
    emptyMessage?: string;
}
export declare function IncidentTimeline(props: IncidentTimelineProps): import("react").JSX.Element;
