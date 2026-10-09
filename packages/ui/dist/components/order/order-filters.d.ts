import { type DomainFrameProps } from '../../internal/domain.js';
import type { OrderStatus } from './types.js';
export interface OrderFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: OrderStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: OrderStatus | '') => void;
}
export declare function OrderFilters({ onStatusChange, ...props }: OrderFiltersProps): import("react").JSX.Element;
