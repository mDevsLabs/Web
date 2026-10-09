import { type DomainFrameProps } from '../../internal/domain.js';
import type { Employee } from './types.js';
export interface EmployeeListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Employee[];
    onSelect?: (item: Employee) => void;
    emptyMessage?: string;
}
export declare function EmployeeList({ onSelect, ...props }: EmployeeListProps): import("react").JSX.Element;
