import { type DomainFrameProps } from '../../internal/domain.js';
import type { Invoice } from './types.js';
export interface InvoiceListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Invoice[];
    onSelect?: (item: Invoice) => void;
    emptyMessage?: string;
}
export declare function InvoiceList({ onSelect, ...props }: InvoiceListProps): import("react").JSX.Element;
