import { type DomainFrameProps } from '../../internal/domain.js';
import type { CommentActivity } from './types.js';
export interface CommentTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly CommentActivity[];
    emptyMessage?: string;
}
export declare function CommentTimeline(props: CommentTimelineProps): import("react").JSX.Element;
