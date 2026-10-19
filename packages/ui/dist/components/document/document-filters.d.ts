import { type DomainFrameProps } from '../../internal/domain.js';
import type { DocumentStatus } from './types.js';
export interface DocumentFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: DocumentStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: DocumentStatus | '') => void;
}
export declare function DocumentFilters({ onStatusChange, ...props }: DocumentFiltersProps): import("react").JSX.Element;
