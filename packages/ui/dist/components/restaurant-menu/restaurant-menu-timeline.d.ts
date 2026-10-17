import { type DomainFrameProps } from '../../internal/domain.js';
import type { RestaurantMenuActivity } from './types.js';
export interface RestaurantMenuTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly RestaurantMenuActivity[];
    emptyMessage?: string;
}
export declare function RestaurantMenuTimeline(props: RestaurantMenuTimelineProps): import("react").JSX.Element;
