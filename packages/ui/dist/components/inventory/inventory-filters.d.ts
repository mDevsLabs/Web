import { type DomainFrameProps } from '../../internal/domain.js';
import type { InventoryStatus } from './types.js';
export interface InventoryFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: InventoryStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: InventoryStatus | '') => void;
}
export declare function InventoryFilters({ onStatusChange, ...props }: InventoryFiltersProps): import("react").JSX.Element;
