import { type DomainFrameProps } from '../../internal/domain.js';
import type { LeaveRequest } from './types.js';
export interface LeaveRequestCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: LeaveRequest;
}
export declare function LeaveRequestCard(props: LeaveRequestCardProps): import("react").JSX.Element;
