import { type DomainFrameProps } from '../../internal/domain.js';
import type { Budget } from './types.js';
export interface BudgetCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Budget;
}
export declare function BudgetCard(props: BudgetCardProps): import("react").JSX.Element;
