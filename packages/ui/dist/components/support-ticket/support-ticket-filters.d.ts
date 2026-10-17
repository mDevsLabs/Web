import { type DomainFrameProps } from '../../internal/domain.js';
import type { SupportTicketStatus } from './types.js';
export interface SupportTicketFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: SupportTicketStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: SupportTicketStatus | '') => void;
}
export declare function SupportTicketFilters({ onStatusChange, ...props }: SupportTicketFiltersProps): import("react").JSX.Element;
