import { type DomainFrameProps } from '../../internal/domain.js';
import type { TagStatus } from './types.js';
export interface TagFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: TagStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: TagStatus | '') => void;
}
export declare function TagFilters({ onStatusChange, ...props }: TagFiltersProps): import("react").JSX.Element;
