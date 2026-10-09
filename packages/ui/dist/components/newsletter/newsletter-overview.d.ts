import { type DomainFrameProps } from '../../internal/domain.js';
import type { Newsletter, NewsletterMetric } from './types.js';
export interface NewsletterOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Newsletter[];
    metrics: readonly NewsletterMetric[];
}
export declare function NewsletterOverview(props: NewsletterOverviewProps): import("react").JSX.Element;
