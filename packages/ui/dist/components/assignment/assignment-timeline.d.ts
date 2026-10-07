import { type DomainFrameProps } from '../../internal/domain.js';
import type { AssignmentActivity } from './types.js';
export interface AssignmentTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly AssignmentActivity[];
    emptyMessage?: string;
}
export declare function AssignmentTimeline(props: AssignmentTimelineProps): import("react").JSX.Element;
