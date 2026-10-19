import { type DomainFrameProps } from '../../internal/domain.js';
import type { Quote, QuoteMetric } from './types.js';
export interface QuoteOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Quote[];
    metrics: readonly QuoteMetric[];
}
export declare function QuoteOverview(props: QuoteOverviewProps): import("react").JSX.Element;
