import { type DomainFrameProps } from '../../internal/domain.js';
import type { Budget } from './types.js';
export interface BudgetTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Budget[];
    emptyMessage?: string;
}
export declare function BudgetTable(props: BudgetTableProps): import("react").JSX.Element;
