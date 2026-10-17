import { type DomainFrameProps } from '../../internal/domain.js';
import type { SavedFilterStatus } from './types.js';
export interface SavedFilterFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: SavedFilterStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: SavedFilterStatus | '') => void;
}
export declare function SavedFilterFilters({ onStatusChange, ...props }: SavedFilterFiltersProps): import("react").JSX.Element;
