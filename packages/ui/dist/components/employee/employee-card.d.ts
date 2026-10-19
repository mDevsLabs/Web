import { type DomainFrameProps } from '../../internal/domain.js';
import type { Employee } from './types.js';
export interface EmployeeCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Employee;
}
export declare function EmployeeCard(props: EmployeeCardProps): import("react").JSX.Element;
