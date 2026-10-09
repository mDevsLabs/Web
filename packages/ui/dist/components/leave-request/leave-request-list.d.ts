import { type DomainFrameProps } from '../../internal/domain.js';
import type { LeaveRequest } from './types.js';
export interface LeaveRequestListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly LeaveRequest[];
    onSelect?: (item: LeaveRequest) => void;
    emptyMessage?: string;
}
export declare function LeaveRequestList({ onSelect, ...props }: LeaveRequestListProps): import("react").JSX.Element;
