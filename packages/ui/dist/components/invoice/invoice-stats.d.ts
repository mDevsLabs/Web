import { type DomainFrameProps } from '../../internal/domain.js';
import type { InvoiceMetric } from './types.js';
export interface InvoiceStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly InvoiceMetric[];
}
export declare function InvoiceStats(props: InvoiceStatsProps): import("react").JSX.Element;
