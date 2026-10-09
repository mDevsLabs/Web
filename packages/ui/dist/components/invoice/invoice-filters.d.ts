import { type DomainFrameProps } from '../../internal/domain.js';
import type { InvoiceStatus } from './types.js';
export interface InvoiceFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: InvoiceStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: InvoiceStatus | '') => void;
}
export declare function InvoiceFilters({ onStatusChange, ...props }: InvoiceFiltersProps): import("react").JSX.Element;
