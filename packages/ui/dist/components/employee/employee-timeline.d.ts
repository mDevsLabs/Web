import { type DomainFrameProps } from '../../internal/domain.js';
import type { EmployeeActivity } from './types.js';
export interface EmployeeTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly EmployeeActivity[];
    emptyMessage?: string;
}
export declare function EmployeeTimeline(props: EmployeeTimelineProps): import("react").JSX.Element;
