import { type DomainFrameProps } from '../../internal/domain.js';
import type { Employee } from './types.js';
export interface EmployeeFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Employee>;
    onSubmit: (value: Omit<Employee, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function EmployeeForm({ onSubmit, ...props }: EmployeeFormProps): import("react").JSX.Element;
