import { type DomainFrameProps } from '../../internal/domain.js';
import type { WorkoutActivity } from './types.js';
export interface WorkoutTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly WorkoutActivity[];
    emptyMessage?: string;
}
export declare function WorkoutTimeline(props: WorkoutTimelineProps): import("react").JSX.Element;
