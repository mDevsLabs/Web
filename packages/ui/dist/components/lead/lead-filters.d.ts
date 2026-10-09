import { type DomainFrameProps } from '../../internal/domain.js';
import type { LeadStatus } from './types.js';
export interface LeadFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: LeadStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: LeadStatus | '') => void;
}
export declare function LeadFilters({ onStatusChange, ...props }: LeadFiltersProps): import("react").JSX.Element;
