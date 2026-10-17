import { type DomainFrameProps } from '../../internal/domain.js';
import type { PurchaseOrderStatus } from './types.js';
export interface PurchaseOrderFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: PurchaseOrderStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: PurchaseOrderStatus | '') => void;
}
export declare function PurchaseOrderFilters({ onStatusChange, ...props }: PurchaseOrderFiltersProps): import("react").JSX.Element;
