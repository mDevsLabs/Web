import { type DomainFrameProps } from '../../internal/domain.js';
import type { LeaveRequest, LeaveRequestMetric } from './types.js';
export interface LeaveRequestOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly LeaveRequest[];
    metrics: readonly LeaveRequestMetric[];
}
export declare function LeaveRequestOverview(props: LeaveRequestOverviewProps): import("react").JSX.Element;
