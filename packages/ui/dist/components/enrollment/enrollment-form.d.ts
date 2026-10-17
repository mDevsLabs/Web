import { type DomainFrameProps } from '../../internal/domain.js';
import type { Enrollment } from './types.js';
export interface EnrollmentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Enrollment>;
    onSubmit: (value: Omit<Enrollment, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function EnrollmentForm({ onSubmit, ...props }: EnrollmentFormProps): import("react").JSX.Element;
