import { type DomainFrameProps } from '../../internal/domain.js';
import type { QuoteStatus } from './types.js';
export interface QuoteFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: QuoteStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: QuoteStatus | '') => void;
}
export declare function QuoteFilters({ onStatusChange, ...props }: QuoteFiltersProps): import("react").JSX.Element;
