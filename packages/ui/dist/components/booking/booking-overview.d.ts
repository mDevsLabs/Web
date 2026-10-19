import { type DomainFrameProps } from '../../internal/domain.js';
import type { Booking, BookingMetric } from './types.js';
export interface BookingOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Booking[];
    metrics: readonly BookingMetric[];
}
export declare function BookingOverview(props: BookingOverviewProps): import("react").JSX.Element;
