import { type DomainFrameProps } from '../../internal/domain.js';
import type { RepositoryStatus } from './types.js';
export interface RepositoryFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: RepositoryStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: RepositoryStatus | '') => void;
}
export declare function RepositoryFilters({ onStatusChange, ...props }: RepositoryFiltersProps): import("react").JSX.Element;
