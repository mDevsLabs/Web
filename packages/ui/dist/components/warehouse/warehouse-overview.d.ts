import { type DomainFrameProps } from '../../internal/domain.js';
import type { Warehouse, WarehouseMetric } from './types.js';
export interface WarehouseOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Warehouse[];
    metrics: readonly WarehouseMetric[];
}
export declare function WarehouseOverview(props: WarehouseOverviewProps): import("react").JSX.Element;
