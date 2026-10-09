import { type DomainFrameProps } from '../../internal/domain.js';
import type { MedicalAppointment } from './types.js';
export interface MedicalAppointmentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: MedicalAppointment;
}
export declare function MedicalAppointmentCard(props: MedicalAppointmentCardProps): import("react").JSX.Element;
