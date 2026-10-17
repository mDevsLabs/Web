import { type DomainFrameProps } from '../../internal/domain.js';
import type { Expense } from './types.js';
export interface ExpenseCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Expense;
}
export declare function ExpenseCard(props: ExpenseCardProps): import("react").JSX.Element;
