import { type DomainFrameProps } from '../../internal/domain.js';
import type { ArticleActivity } from './types.js';
export interface ArticleTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ArticleActivity[];
    emptyMessage?: string;
}
export declare function ArticleTimeline(props: ArticleTimelineProps): import("react").JSX.Element;
