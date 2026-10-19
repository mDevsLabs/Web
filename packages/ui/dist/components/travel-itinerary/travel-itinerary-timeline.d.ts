import { type DomainFrameProps } from '../../internal/domain.js';
import type { TravelItineraryActivity } from './types.js';
export interface TravelItineraryTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly TravelItineraryActivity[];
    emptyMessage?: string;
}
export declare function TravelItineraryTimeline(props: TravelItineraryTimelineProps): import("react").JSX.Element;
