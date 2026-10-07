import { type DomainFrameProps } from '../../internal/domain.js';
import type { MedicalAppointment, MedicalAppointmentMetric } from './types.js';
export interface MedicalAppointmentOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly MedicalAppointment[];
    metrics: readonly MedicalAppointmentMetric[];
}
export declare function MedicalAppointmentOverview(props: MedicalAppointmentOverviewProps): import("react").JSX.Element;
