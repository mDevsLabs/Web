import { type DomainFrameProps } from '../../internal/domain.js';
import type { CustomerMetric } from './types.js';
export interface CustomerStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly CustomerMetric[];
}
export declare function CustomerStats(props: CustomerStatsProps): import("react").JSX.Element;
