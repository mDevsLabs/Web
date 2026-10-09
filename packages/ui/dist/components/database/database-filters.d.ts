import { type DomainFrameProps } from '../../internal/domain.js';
import type { DatabaseStatus } from './types.js';
export interface DatabaseFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: DatabaseStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: DatabaseStatus | '') => void;
}
export declare function DatabaseFilters({ onStatusChange, ...props }: DatabaseFiltersProps): import("react").JSX.Element;
