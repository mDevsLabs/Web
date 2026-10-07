import { type DomainFrameProps } from '../../internal/domain.js';
import type { VenueActivity } from './types.js';
export interface VenueTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly VenueActivity[];
    emptyMessage?: string;
}
export declare function VenueTimeline(props: VenueTimelineProps): import("react").JSX.Element;
