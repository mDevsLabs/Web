import { type DomainFrameProps } from '../../internal/domain.js';
import type { CollectionStatus } from './types.js';
export interface CollectionFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: CollectionStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: CollectionStatus | '') => void;
}
export declare function CollectionFilters({ onStatusChange, ...props }: CollectionFiltersProps): import("react").JSX.Element;
