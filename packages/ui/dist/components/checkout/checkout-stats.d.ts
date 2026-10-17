import { type DomainFrameProps } from '../../internal/domain.js';
import type { CheckoutMetric } from './types.js';
export interface CheckoutStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly CheckoutMetric[];
}
export declare function CheckoutStats(props: CheckoutStatsProps): import("react").JSX.Element;
