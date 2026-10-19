import { type DomainFrameProps } from '../../internal/domain.js';
import type { NewsletterMetric } from './types.js';
export interface NewsletterStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly NewsletterMetric[];
}
export declare function NewsletterStats(props: NewsletterStatsProps): import("react").JSX.Element;
