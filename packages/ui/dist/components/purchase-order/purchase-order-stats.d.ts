import { type DomainFrameProps } from '../../internal/domain.js';
import type { PurchaseOrderMetric } from './types.js';
export interface PurchaseOrderStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly PurchaseOrderMetric[];
}
export declare function PurchaseOrderStats(props: PurchaseOrderStatsProps): import("react").JSX.Element;
