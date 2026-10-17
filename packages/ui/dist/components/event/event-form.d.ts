import { type DomainFrameProps } from '../../internal/domain.js';
import type { Event } from './types.js';
export interface EventFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Event>;
    onSubmit: (value: Omit<Event, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function EventForm({ onSubmit, ...props }: EventFormProps): import("react").JSX.Element;
