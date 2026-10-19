import { type DomainFrameProps } from '../../internal/domain.js';
import type { Payroll, PayrollMetric } from './types.js';
export interface PayrollOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Payroll[];
    metrics: readonly PayrollMetric[];
}
export declare function PayrollOverview(props: PayrollOverviewProps): import("react").JSX.Element;
