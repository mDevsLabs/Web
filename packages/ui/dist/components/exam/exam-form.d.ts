import { type DomainFrameProps } from '../../internal/domain.js';
import type { Exam } from './types.js';
export interface ExamFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Exam>;
    onSubmit: (value: Omit<Exam, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function ExamForm({ onSubmit, ...props }: ExamFormProps): import("react").JSX.Element;
