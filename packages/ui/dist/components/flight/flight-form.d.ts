import { type DomainFrameProps } from '../../internal/domain.js';
import type { Flight } from './types.js';
export interface FlightFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Flight>;
    onSubmit: (value: Omit<Flight, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function FlightForm({ onSubmit, ...props }: FlightFormProps): import("react").JSX.Element;
