import { type DomainFrameProps } from '../../internal/domain.js';
import type { TablePresetStatus } from './types.js';
export interface TablePresetFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: TablePresetStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: TablePresetStatus | '') => void;
}
export declare function TablePresetFilters({ onStatusChange, ...props }: TablePresetFiltersProps): import("react").JSX.Element;
