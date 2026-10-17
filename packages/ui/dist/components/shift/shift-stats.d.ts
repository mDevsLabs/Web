import { type DomainFrameProps } from '../../internal/domain.js';
import type { ShiftMetric } from './types.js';
export interface ShiftStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ShiftMetric[];
}
export declare function ShiftStats(props: ShiftStatsProps): import("react").JSX.Element;
