import { type DomainFrameProps } from '../../internal/domain.js';
import type { Supplier, SupplierMetric } from './types.js';
export interface SupplierOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Supplier[];
    metrics: readonly SupplierMetric[];
}
export declare function SupplierOverview(props: SupplierOverviewProps): import("react").JSX.Element;
