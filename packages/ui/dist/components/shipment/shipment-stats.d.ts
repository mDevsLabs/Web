import { type DomainFrameProps } from '../../internal/domain.js';
import type { ShipmentMetric } from './types.js';
export interface ShipmentStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ShipmentMetric[];
}
export declare function ShipmentStats(props: ShipmentStatsProps): import("react").JSX.Element;
