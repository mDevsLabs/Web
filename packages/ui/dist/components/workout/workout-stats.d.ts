import { type DomainFrameProps } from '../../internal/domain.js';
import type { WorkoutMetric } from './types.js';
export interface WorkoutStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly WorkoutMetric[];
}
export declare function WorkoutStats(props: WorkoutStatsProps): import("react").JSX.Element;
