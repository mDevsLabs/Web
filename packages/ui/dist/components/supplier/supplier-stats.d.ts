import { type DomainFrameProps } from '../../internal/domain.js';
import type { SupplierMetric } from './types.js';
export interface SupplierStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly SupplierMetric[];
}
export declare function SupplierStats(props: SupplierStatsProps): import("react").JSX.Element;
