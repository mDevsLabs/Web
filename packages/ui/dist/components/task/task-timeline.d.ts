import { type DomainFrameProps } from '../../internal/domain.js';
import type { TaskActivity } from './types.js';
export interface TaskTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly TaskActivity[];
    emptyMessage?: string;
}
export declare function TaskTimeline(props: TaskTimelineProps): import("react").JSX.Element;
