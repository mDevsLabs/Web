import { type DomainFrameProps } from '../../internal/domain.js';
import type { Invoice } from './types.js';
export interface InvoiceTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Invoice[];
    emptyMessage?: string;
}
export declare function InvoiceTable(props: InvoiceTableProps): import("react").JSX.Element;
