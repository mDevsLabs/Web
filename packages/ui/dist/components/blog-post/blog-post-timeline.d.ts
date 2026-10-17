import { type DomainFrameProps } from '../../internal/domain.js';
import type { BlogPostActivity } from './types.js';
export interface BlogPostTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly BlogPostActivity[];
    emptyMessage?: string;
}
export declare function BlogPostTimeline(props: BlogPostTimelineProps): import("react").JSX.Element;
