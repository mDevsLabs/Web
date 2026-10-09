import { type DomainFrameProps } from '../../internal/domain.js';
import type { OrderMetric } from './types.js';
export interface OrderStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly OrderMetric[];
}
export declare function OrderStats(props: OrderStatsProps): import("react").JSX.Element;
