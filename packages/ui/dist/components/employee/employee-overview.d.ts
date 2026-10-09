import { type DomainFrameProps } from '../../internal/domain.js';
import type { Employee, EmployeeMetric } from './types.js';
export interface EmployeeOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Employee[];
    metrics: readonly EmployeeMetric[];
}
export declare function EmployeeOverview(props: EmployeeOverviewProps): import("react").JSX.Element;
