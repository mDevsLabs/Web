import { type DomainFrameProps } from '../../internal/domain.js';
import type { AssignmentMetric } from './types.js';
export interface AssignmentStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly AssignmentMetric[];
}
export declare function AssignmentStats(props: AssignmentStatsProps): import("react").JSX.Element;
