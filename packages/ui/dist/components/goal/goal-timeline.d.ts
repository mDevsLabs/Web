import { type DomainFrameProps } from '../../internal/domain.js';
import type { GoalActivity } from './types.js';
export interface GoalTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly GoalActivity[];
    emptyMessage?: string;
}
export declare function GoalTimeline(props: GoalTimelineProps): import("react").JSX.Element;
