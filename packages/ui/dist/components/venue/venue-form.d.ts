import { type DomainFrameProps } from '../../internal/domain.js';
import type { Venue } from './types.js';
export interface VenueFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Venue>;
    onSubmit: (value: Omit<Venue, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function VenueForm({ onSubmit, ...props }: VenueFormProps): import("react").JSX.Element;
