import { type DomainFrameProps } from '../../internal/domain.js';
import type { PrescriptionMetric } from './types.js';
export interface PrescriptionStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly PrescriptionMetric[];
}
export declare function PrescriptionStats(props: PrescriptionStatsProps): import("react").JSX.Element;
