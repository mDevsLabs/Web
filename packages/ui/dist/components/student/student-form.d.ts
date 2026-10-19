import { type DomainFrameProps } from '../../internal/domain.js';
import type { Student } from './types.js';
export interface StudentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Student>;
    onSubmit: (value: Omit<Student, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function StudentForm({ onSubmit, ...props }: StudentFormProps): import("react").JSX.Element;
