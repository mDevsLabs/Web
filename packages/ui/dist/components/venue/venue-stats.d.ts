import { type DomainFrameProps } from '../../internal/domain.js';
import type { VenueMetric } from './types.js';
export interface VenueStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly VenueMetric[];
}
export declare function VenueStats(props: VenueStatsProps): import("react").JSX.Element;
