import { type DomainFrameProps } from '../../internal/domain.js';
import type { Expense } from './types.js';
export interface ExpenseTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Expense[];
    emptyMessage?: string;
}
export declare function ExpenseTable(props: ExpenseTableProps): import("react").JSX.Element;
