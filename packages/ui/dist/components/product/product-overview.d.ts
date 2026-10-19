import { type DomainFrameProps } from '../../internal/domain.js';
import type { Product, ProductMetric } from './types.js';
export interface ProductOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Product[];
    metrics: readonly ProductMetric[];
}
export declare function ProductOverview(props: ProductOverviewProps): import("react").JSX.Element;
