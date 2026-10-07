import { type DomainFrameProps } from '../../internal/domain.js';
import type { Course } from './types.js';
export interface CourseFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Course>;
    onSubmit: (value: Omit<Course, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function CourseForm({ onSubmit, ...props }: CourseFormProps): import("react").JSX.Element;
