import { type DomainFrameProps } from '../../internal/domain.js';
import type { Goal, GoalMetric } from './types.js';
export interface GoalOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Goal[];
    metrics: readonly GoalMetric[];
}
export declare function GoalOverview(props: GoalOverviewProps): import("react").JSX.Element;
