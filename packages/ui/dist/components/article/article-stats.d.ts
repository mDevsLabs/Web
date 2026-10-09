import { type DomainFrameProps } from '../../internal/domain.js';
import type { ArticleMetric } from './types.js';
export interface ArticleStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ArticleMetric[];
}
export declare function ArticleStats(props: ArticleStatsProps): import("react").JSX.Element;
