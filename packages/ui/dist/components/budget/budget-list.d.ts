import { type DomainFrameProps } from '../../internal/domain.js';
import type { Budget } from './types.js';
export interface BudgetListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Budget[];
    onSelect?: (item: Budget) => void;
    emptyMessage?: string;
}
export declare function BudgetList({ onSelect, ...props }: BudgetListProps): import("react").JSX.Element;
