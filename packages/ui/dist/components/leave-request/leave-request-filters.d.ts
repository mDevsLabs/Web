import { type DomainFrameProps } from '../../internal/domain.js';
import type { LeaveRequestStatus } from './types.js';
export interface LeaveRequestFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: LeaveRequestStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: LeaveRequestStatus | '') => void;
}
export declare function LeaveRequestFilters({ onStatusChange, ...props }: LeaveRequestFiltersProps): import("react").JSX.Element;
