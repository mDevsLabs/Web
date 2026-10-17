import { type DomainFrameProps } from '../../internal/domain.js';
import type { BlogPostMetric } from './types.js';
export interface BlogPostStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly BlogPostMetric[];
}
export declare function BlogPostStats(props: BlogPostStatsProps): import("react").JSX.Element;
