import { type DomainFrameProps } from '../../internal/domain.js';
import type { PayrollMetric } from './types.js';
export interface PayrollStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly PayrollMetric[];
}
export declare function PayrollStats(props: PayrollStatsProps): import("react").JSX.Element;
