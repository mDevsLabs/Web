import { type DomainFrameProps } from '../../internal/domain.js';
import type { Assignment } from './types.js';
export interface AssignmentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Assignment>;
    onSubmit: (value: Omit<Assignment, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function AssignmentForm({ onSubmit, ...props }: AssignmentFormProps): import("react").JSX.Element;
