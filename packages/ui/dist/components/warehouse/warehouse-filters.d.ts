import { type DomainFrameProps } from '../../internal/domain.js';
import type { WarehouseStatus } from './types.js';
export interface WarehouseFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: WarehouseStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: WarehouseStatus | '') => void;
}
export declare function WarehouseFilters({ onStatusChange, ...props }: WarehouseFiltersProps): import("react").JSX.Element;
