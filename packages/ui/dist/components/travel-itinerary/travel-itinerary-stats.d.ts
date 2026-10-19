import { type DomainFrameProps } from '../../internal/domain.js';
import type { TravelItineraryMetric } from './types.js';
export interface TravelItineraryStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly TravelItineraryMetric[];
}
export declare function TravelItineraryStats(props: TravelItineraryStatsProps): import("react").JSX.Element;
