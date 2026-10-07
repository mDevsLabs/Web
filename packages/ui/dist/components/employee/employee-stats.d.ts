import { type DomainFrameProps } from '../../internal/domain.js';
import type { EmployeeMetric } from './types.js';
export interface EmployeeStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly EmployeeMetric[];
}
export declare function EmployeeStats(props: EmployeeStatsProps): import("react").JSX.Element;
