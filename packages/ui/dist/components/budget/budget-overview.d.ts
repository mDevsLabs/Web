import { type DomainFrameProps } from '../../internal/domain.js';
import type { Budget, BudgetMetric } from './types.js';
export interface BudgetOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Budget[];
    metrics: readonly BudgetMetric[];
}
export declare function BudgetOverview(props: BudgetOverviewProps): import("react").JSX.Element;
