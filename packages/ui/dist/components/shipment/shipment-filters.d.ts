import { type DomainFrameProps } from '../../internal/domain.js';
import type { ShipmentStatus } from './types.js';
export interface ShipmentFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: ShipmentStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: ShipmentStatus | '') => void;
}
export declare function ShipmentFilters({ onStatusChange, ...props }: ShipmentFiltersProps): import("react").JSX.Element;
