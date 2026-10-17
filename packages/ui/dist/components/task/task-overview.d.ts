import { type DomainFrameProps } from '../../internal/domain.js';
import type { Task, TaskMetric } from './types.js';
export interface TaskOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Task[];
    metrics: readonly TaskMetric[];
}
export declare function TaskOverview(props: TaskOverviewProps): import("react").JSX.Element;
