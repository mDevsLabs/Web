import { type DomainFrameProps } from '../../internal/domain.js';
import type { Lesson } from './types.js';
export interface LessonFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Lesson>;
    onSubmit: (value: Omit<Lesson, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function LessonForm({ onSubmit, ...props }: LessonFormProps): import("react").JSX.Element;
