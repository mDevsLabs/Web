import { type DomainFrameProps } from '../../internal/domain.js';
import type { Invoice } from './types.js';
export interface InvoiceCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Invoice;
}
export declare function InvoiceCard(props: InvoiceCardProps): import("react").JSX.Element;
