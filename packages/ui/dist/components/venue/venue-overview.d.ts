import { type DomainFrameProps } from '../../internal/domain.js';
import type { Venue, VenueMetric } from './types.js';
export interface VenueOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Venue[];
    metrics: readonly VenueMetric[];
}
export declare function VenueOverview(props: VenueOverviewProps): import("react").JSX.Element;
