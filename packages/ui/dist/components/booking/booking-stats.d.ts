import { type DomainFrameProps } from '../../internal/domain.js';
import type { BookingMetric } from './types.js';
export interface BookingStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly BookingMetric[];
}
export declare function BookingStats(props: BookingStatsProps): import("react").JSX.Element;
