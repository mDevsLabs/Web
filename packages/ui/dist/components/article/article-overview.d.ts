import { type DomainFrameProps } from '../../internal/domain.js';
import type { Article, ArticleMetric } from './types.js';
export interface ArticleOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Article[];
    metrics: readonly ArticleMetric[];
}
export declare function ArticleOverview(props: ArticleOverviewProps): import("react").JSX.Element;
