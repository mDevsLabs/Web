import { type DomainFrameProps } from '../../internal/domain.js';
import type { CartStatus } from './types.js';
export interface CartFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: CartStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: CartStatus | '') => void;
}
export declare function CartFilters({ onStatusChange, ...props }: CartFiltersProps): import("react").JSX.Element;
