import { type DomainFrameProps } from '../../internal/domain.js';
import type { Workout, WorkoutMetric } from './types.js';
export interface WorkoutOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Workout[];
    metrics: readonly WorkoutMetric[];
}
export declare function WorkoutOverview(props: WorkoutOverviewProps): import("react").JSX.Element;
