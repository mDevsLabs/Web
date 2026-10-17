import { type DomainFrameProps } from '../../internal/domain.js';
import type { TaskMetric } from './types.js';
export interface TaskStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly TaskMetric[];
}
export declare function TaskStats(props: TaskStatsProps): import("react").JSX.Element;
