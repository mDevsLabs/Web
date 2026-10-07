import { type DomainFrameProps } from '../../internal/domain.js';
import type { DestinationMetric } from './types.js';
export interface DestinationStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly DestinationMetric[];
}
export declare function DestinationStats(props: DestinationStatsProps): import("react").JSX.Element;
