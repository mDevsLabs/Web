import { type DomainFrameProps } from '../../internal/domain.js';
import type { FlightMetric } from './types.js';
export interface FlightStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly FlightMetric[];
}
export declare function FlightStats(props: FlightStatsProps): import("react").JSX.Element;
