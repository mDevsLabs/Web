import { type DomainFrameProps } from '../../internal/domain.js';
import type { MedicalAppointment } from './types.js';
export interface MedicalAppointmentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<MedicalAppointment>;
    onSubmit: (value: Omit<MedicalAppointment, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function MedicalAppointmentForm({ onSubmit, ...props }: MedicalAppointmentFormProps): import("react").JSX.Element;
