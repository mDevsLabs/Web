import { type DomainFrameProps } from '../../internal/domain.js';
import type { Cart, CartMetric } from './types.js';
export interface CartOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Cart[];
    metrics: readonly CartMetric[];
}
export declare function CartOverview(props: CartOverviewProps): import("react").JSX.Element;
