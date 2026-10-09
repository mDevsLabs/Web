import { type DomainFrameProps } from '../../internal/domain.js';
import type { Prescription, PrescriptionMetric } from './types.js';
export interface PrescriptionOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Prescription[];
    metrics: readonly PrescriptionMetric[];
}
export declare function PrescriptionOverview(props: PrescriptionOverviewProps): import("react").JSX.Element;
