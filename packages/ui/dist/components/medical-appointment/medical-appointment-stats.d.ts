import { type DomainFrameProps } from '../../internal/domain.js';
import type { MedicalAppointmentMetric } from './types.js';
export interface MedicalAppointmentStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly MedicalAppointmentMetric[];
}
export declare function MedicalAppointmentStats(props: MedicalAppointmentStatsProps): import("react").JSX.Element;
