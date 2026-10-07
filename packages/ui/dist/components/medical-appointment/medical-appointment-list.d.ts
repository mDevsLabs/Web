import { type DomainFrameProps } from '../../internal/domain.js';
import type { MedicalAppointment } from './types.js';
export interface MedicalAppointmentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly MedicalAppointment[];
    onSelect?: (item: MedicalAppointment) => void;
    emptyMessage?: string;
}
export declare function MedicalAppointmentList({ onSelect, ...props }: MedicalAppointmentListProps): import("react").JSX.Element;
