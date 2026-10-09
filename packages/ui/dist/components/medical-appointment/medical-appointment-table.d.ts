import { type DomainFrameProps } from '../../internal/domain.js';
import type { MedicalAppointment } from './types.js';
export interface MedicalAppointmentTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly MedicalAppointment[];
    emptyMessage?: string;
}
export declare function MedicalAppointmentTable(props: MedicalAppointmentTableProps): import("react").JSX.Element;
