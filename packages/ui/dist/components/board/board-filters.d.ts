import { type DomainFrameProps } from '../../internal/domain.js';
import type { BoardStatus } from './types.js';
export interface BoardFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: BoardStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: BoardStatus | '') => void;
}
export declare function BoardFilters({ onStatusChange, ...props }: BoardFiltersProps): import("react").JSX.Element;
