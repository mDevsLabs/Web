import { type DomainFrameProps } from '../../internal/domain.js';
import type { Booking } from './types.js';
export interface BookingFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Booking>;
    onSubmit: (value: Omit<Booking, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function BookingForm({ onSubmit, ...props }: BookingFormProps): import("react").JSX.Element;
