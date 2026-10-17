import { type DomainFrameProps } from '../../internal/domain.js';
import type { TagActivity } from './types.js';
export interface TagTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly TagActivity[];
    emptyMessage?: string;
}
export declare function TagTimeline(props: TagTimelineProps): import("react").JSX.Element;
