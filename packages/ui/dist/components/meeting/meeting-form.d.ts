import { type DomainFrameProps } from '../../internal/domain.js';
import type { Meeting } from './types.js';
export interface MeetingFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Meeting>;
    onSubmit: (value: Omit<Meeting, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function MeetingForm({ onSubmit, ...props }: MeetingFormProps): import("react").JSX.Element;
