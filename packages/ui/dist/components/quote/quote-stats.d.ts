import { type DomainFrameProps } from '../../internal/domain.js';
import type { QuoteMetric } from './types.js';
export interface QuoteStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly QuoteMetric[];
}
export declare function QuoteStats(props: QuoteStatsProps): import("react").JSX.Element;
