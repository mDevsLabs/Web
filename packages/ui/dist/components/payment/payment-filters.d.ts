import { type DomainFrameProps } from '../../internal/domain.js';
import type { PaymentStatus } from './types.js';
export interface PaymentFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: PaymentStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: PaymentStatus | '') => void;
}
export declare function PaymentFilters({ onStatusChange, ...props }: PaymentFiltersProps): import("react").JSX.Element;
