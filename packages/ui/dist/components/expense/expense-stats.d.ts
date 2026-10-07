import { type DomainFrameProps } from '../../internal/domain.js';
import type { ExpenseMetric } from './types.js';
export interface ExpenseStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ExpenseMetric[];
}
export declare function ExpenseStats(props: ExpenseStatsProps): import("react").JSX.Element;
