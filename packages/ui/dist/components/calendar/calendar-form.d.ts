import { type DomainFrameProps } from '../../internal/domain.js';
import type { Calendar } from './types.js';
export interface CalendarFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Calendar>;
    onSubmit: (value: Omit<Calendar, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function CalendarForm({ onSubmit, ...props }: CalendarFormProps): import("react").JSX.Element;
