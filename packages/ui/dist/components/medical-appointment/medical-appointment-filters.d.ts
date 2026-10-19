import { type DomainFrameProps } from '../../internal/domain.js';
import type { MedicalAppointmentStatus } from './types.js';
export interface MedicalAppointmentFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: MedicalAppointmentStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: MedicalAppointmentStatus | '') => void;
}
export declare function MedicalAppointmentFilters({ onStatusChange, ...props }: MedicalAppointmentFiltersProps): import("react").JSX.Element;
