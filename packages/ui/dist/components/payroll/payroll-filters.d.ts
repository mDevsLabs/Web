import { type DomainFrameProps } from '../../internal/domain.js';
import type { PayrollStatus } from './types.js';
export interface PayrollFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: PayrollStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: PayrollStatus | '') => void;
}
export declare function PayrollFilters({ onStatusChange, ...props }: PayrollFiltersProps): import("react").JSX.Element;
