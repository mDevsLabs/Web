import { type DomainFrameProps } from '../../internal/domain.js';
import type { InventoryMetric } from './types.js';
export interface InventoryStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly InventoryMetric[];
}
export declare function InventoryStats(props: InventoryStatsProps): import("react").JSX.Element;
