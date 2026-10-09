import { type DomainFrameProps } from '../../internal/domain.js';
import type { MilestoneActivity } from './types.js';
export interface MilestoneTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly MilestoneActivity[];
    emptyMessage?: string;
}
export declare function MilestoneTimeline(props: MilestoneTimelineProps): import("react").JSX.Element;
