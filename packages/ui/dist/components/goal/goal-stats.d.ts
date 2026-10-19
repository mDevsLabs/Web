import { type DomainFrameProps } from '../../internal/domain.js';
import type { GoalMetric } from './types.js';
export interface GoalStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly GoalMetric[];
}
export declare function GoalStats(props: GoalStatsProps): import("react").JSX.Element;
