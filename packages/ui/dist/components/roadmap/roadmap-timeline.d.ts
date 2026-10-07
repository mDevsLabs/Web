import { type DomainFrameProps } from '../../internal/domain.js';
import type { RoadmapActivity } from './types.js';
export interface RoadmapTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly RoadmapActivity[];
    emptyMessage?: string;
}
export declare function RoadmapTimeline(props: RoadmapTimelineProps): import("react").JSX.Element;
