import { type DomainFrameProps } from '../../internal/domain.js';
import type { CartMetric } from './types.js';
export interface CartStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly CartMetric[];
}
export declare function CartStats(props: CartStatsProps): import("react").JSX.Element;
