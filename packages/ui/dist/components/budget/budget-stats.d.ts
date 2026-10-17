import { type DomainFrameProps } from '../../internal/domain.js';
import type { BudgetMetric } from './types.js';
export interface BudgetStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly BudgetMetric[];
}
export declare function BudgetStats(props: BudgetStatsProps): import("react").JSX.Element;
