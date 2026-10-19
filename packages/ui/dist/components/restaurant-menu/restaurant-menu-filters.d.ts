import { type DomainFrameProps } from '../../internal/domain.js';
import type { RestaurantMenuStatus } from './types.js';
export interface RestaurantMenuFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: RestaurantMenuStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: RestaurantMenuStatus | '') => void;
}
export declare function RestaurantMenuFilters({ onStatusChange, ...props }: RestaurantMenuFiltersProps): import("react").JSX.Element;
