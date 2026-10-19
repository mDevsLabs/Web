import { type DomainFrameProps } from '../../internal/domain.js';
import type { PaymentMetric } from './types.js';
export interface PaymentStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly PaymentMetric[];
}
export declare function PaymentStats(props: PaymentStatsProps): import("react").JSX.Element;
