import { type DomainFrameProps } from '../../internal/domain.js';
import type { PurchaseOrder, PurchaseOrderMetric } from './types.js';
export interface PurchaseOrderOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly PurchaseOrder[];
    metrics: readonly PurchaseOrderMetric[];
}
export declare function PurchaseOrderOverview(props: PurchaseOrderOverviewProps): import("react").JSX.Element;
