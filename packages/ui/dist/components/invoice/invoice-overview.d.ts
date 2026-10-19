import { type DomainFrameProps } from '../../internal/domain.js';
import type { Invoice, InvoiceMetric } from './types.js';
export interface InvoiceOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Invoice[];
    metrics: readonly InvoiceMetric[];
}
export declare function InvoiceOverview(props: InvoiceOverviewProps): import("react").JSX.Element;
