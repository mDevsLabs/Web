import { type DomainFrameProps } from '../../internal/domain.js';
import type { Task } from './types.js';
export interface TaskFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Task>;
    onSubmit: (value: Omit<Task, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function TaskForm({ onSubmit, ...props }: TaskFormProps): import("react").JSX.Element;
