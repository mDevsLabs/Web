import { type DomainFrameProps } from '../../internal/domain.js';
import type { Assignment, AssignmentMetric } from './types.js';
export interface AssignmentOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Assignment[];
    metrics: readonly AssignmentMetric[];
}
export declare function AssignmentOverview(props: AssignmentOverviewProps): import("react").JSX.Element;
