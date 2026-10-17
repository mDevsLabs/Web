import { type DomainFrameProps } from '../../internal/domain.js';
import type { Payment, PaymentMetric } from './types.js';
export interface PaymentOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Payment[];
    metrics: readonly PaymentMetric[];
}
export declare function PaymentOverview(props: PaymentOverviewProps): import("react").JSX.Element;
