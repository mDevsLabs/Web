import { type DomainFrameProps } from '../../internal/domain.js';
import type { ReservationMetric } from './types.js';
export interface ReservationStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ReservationMetric[];
}
export declare function ReservationStats(props: ReservationStatsProps): import("react").JSX.Element;
