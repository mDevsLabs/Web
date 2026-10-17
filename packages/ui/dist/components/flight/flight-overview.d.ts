import { type DomainFrameProps } from '../../internal/domain.js';
import type { Flight, FlightMetric } from './types.js';
export interface FlightOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Flight[];
    metrics: readonly FlightMetric[];
}
export declare function FlightOverview(props: FlightOverviewProps): import("react").JSX.Element;
