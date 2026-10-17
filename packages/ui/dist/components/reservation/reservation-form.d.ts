import { type DomainFrameProps } from '../../internal/domain.js';
import type { Reservation } from './types.js';
export interface ReservationFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Reservation>;
    onSubmit: (value: Omit<Reservation, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function ReservationForm({ onSubmit, ...props }: ReservationFormProps): import("react").JSX.Element;
