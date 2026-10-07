import { type DomainFrameProps } from '../../internal/domain.js';
import type { LeaveRequestMetric } from './types.js';
export interface LeaveRequestStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly LeaveRequestMetric[];
}
export declare function LeaveRequestStats(props: LeaveRequestStatsProps): import("react").JSX.Element;
