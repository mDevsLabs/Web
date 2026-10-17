import { type DomainFrameProps } from '../../internal/domain.js';
import type { LeaveRequest } from './types.js';
export interface LeaveRequestTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly LeaveRequest[];
    emptyMessage?: string;
}
export declare function LeaveRequestTable(props: LeaveRequestTableProps): import("react").JSX.Element;
