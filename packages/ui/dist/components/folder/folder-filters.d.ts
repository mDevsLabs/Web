import { type DomainFrameProps } from '../../internal/domain.js';
import type { FolderStatus } from './types.js';
export interface FolderFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: FolderStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: FolderStatus | '') => void;
}
export declare function FolderFilters({ onStatusChange, ...props }: FolderFiltersProps): import("react").JSX.Element;
