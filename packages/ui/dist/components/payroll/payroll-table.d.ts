import { type DomainFrameProps } from '../../internal/domain.js';
import type { Payroll } from './types.js';
export interface PayrollTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Payroll[];
    emptyMessage?: string;
}
export declare function PayrollTable(props: PayrollTableProps): import("react").JSX.Element;
