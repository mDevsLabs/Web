import { type DomainFrameProps } from '../../internal/domain.js';
import type { Employee } from './types.js';
export interface EmployeeTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Employee[];
    emptyMessage?: string;
}
export declare function EmployeeTable(props: EmployeeTableProps): import("react").JSX.Element;
