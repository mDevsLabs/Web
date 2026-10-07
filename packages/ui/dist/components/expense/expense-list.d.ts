import { type DomainFrameProps } from '../../internal/domain.js';
import type { Expense } from './types.js';
export interface ExpenseListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Expense[];
    onSelect?: (item: Expense) => void;
    emptyMessage?: string;
}
export declare function ExpenseList({ onSelect, ...props }: ExpenseListProps): import("react").JSX.Element;
