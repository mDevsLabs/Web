import { type DomainFrameProps } from '../../internal/domain.js';
import type { CouponStatus } from './types.js';
export interface CouponFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: CouponStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: CouponStatus | '') => void;
}
export declare function CouponFilters({ onStatusChange, ...props }: CouponFiltersProps): import("react").JSX.Element;
