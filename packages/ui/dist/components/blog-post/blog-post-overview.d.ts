import { type DomainFrameProps } from '../../internal/domain.js';
import type { BlogPost, BlogPostMetric } from './types.js';
export interface BlogPostOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly BlogPost[];
    metrics: readonly BlogPostMetric[];
}
export declare function BlogPostOverview(props: BlogPostOverviewProps): import("react").JSX.Element;
