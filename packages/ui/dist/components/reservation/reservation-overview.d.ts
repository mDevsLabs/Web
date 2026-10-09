import { type DomainFrameProps } from '../../internal/domain.js';
import type { Reservation, ReservationMetric } from './types.js';
export interface ReservationOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Reservation[];
    metrics: readonly ReservationMetric[];
}
export declare function ReservationOverview(props: ReservationOverviewProps): import("react").JSX.Element;
