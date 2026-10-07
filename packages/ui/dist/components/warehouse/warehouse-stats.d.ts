import { type DomainFrameProps } from '../../internal/domain.js';
import type { WarehouseMetric } from './types.js';
export interface WarehouseStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly WarehouseMetric[];
}
export declare function WarehouseStats(props: WarehouseStatsProps): import("react").JSX.Element;
