import { type DomainFrameProps } from '../../internal/domain.js';
import type { HabitActivity } from './types.js';
export interface HabitTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly HabitActivity[];
    emptyMessage?: string;
}
export declare function HabitTimeline(props: HabitTimelineProps): import("react").JSX.Element;
