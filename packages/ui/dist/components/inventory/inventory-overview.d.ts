import { type DomainFrameProps } from '../../internal/domain.js';
import type { Inventory, InventoryMetric } from './types.js';
export interface InventoryOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Inventory[];
    metrics: readonly InventoryMetric[];
}
export declare function InventoryOverview(props: InventoryOverviewProps): import("react").JSX.Element;
