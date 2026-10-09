import { type DomainFrameProps } from '../../internal/domain.js';
import type { CheckoutStatus } from './types.js';
export interface CheckoutFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: CheckoutStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: CheckoutStatus | '') => void;
}
export declare function CheckoutFilters({ onStatusChange, ...props }: CheckoutFiltersProps): import("react").JSX.Element;
