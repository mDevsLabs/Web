import { type DomainFrameProps } from '../../internal/domain.js';
import type { Order, OrderMetric } from './types.js';
export interface OrderOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Order[];
    metrics: readonly OrderMetric[];
}
export declare function OrderOverview(props: OrderOverviewProps): import("react").JSX.Element;
