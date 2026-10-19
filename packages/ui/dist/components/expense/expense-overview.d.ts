import { type DomainFrameProps } from '../../internal/domain.js';
import type { Expense, ExpenseMetric } from './types.js';
export interface ExpenseOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Expense[];
    metrics: readonly ExpenseMetric[];
}
export declare function ExpenseOverview(props: ExpenseOverviewProps): import("react").JSX.Element;
