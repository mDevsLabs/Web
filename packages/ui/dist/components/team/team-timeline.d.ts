import { type DomainFrameProps } from '../../internal/domain.js';
import type { TeamActivity } from './types.js';
export interface TeamTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly TeamActivity[];
    emptyMessage?: string;
}
export declare function TeamTimeline(props: TeamTimelineProps): import("react").JSX.Element;
