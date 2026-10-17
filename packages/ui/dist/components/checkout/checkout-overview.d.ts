import { type DomainFrameProps } from '../../internal/domain.js';
import type { Checkout, CheckoutMetric } from './types.js';
export interface CheckoutOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Checkout[];
    metrics: readonly CheckoutMetric[];
}
export declare function CheckoutOverview(props: CheckoutOverviewProps): import("react").JSX.Element;
