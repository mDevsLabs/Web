import { type DomainFrameProps } from '../../internal/domain.js';
import type { ContactStatus } from './types.js';
export interface ContactFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ContactStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ContactStatus | '') => void;
}
export declare function ContactFilters({ onStatusChange, ...props }: ContactFiltersProps): import("react").JSX.Element;
