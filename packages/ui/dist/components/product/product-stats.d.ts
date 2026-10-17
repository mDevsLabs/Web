import { type DomainFrameProps } from '../../internal/domain.js';
import type { ProductMetric } from './types.js';
export interface ProductStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ProductMetric[];
}
export declare function ProductStats(props: ProductStatsProps): import("react").JSX.Element;
