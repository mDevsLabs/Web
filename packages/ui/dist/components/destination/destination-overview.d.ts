import { type DomainFrameProps } from '../../internal/domain.js';
import type { Destination, DestinationMetric } from './types.js';
export interface DestinationOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Destination[];
    metrics: readonly DestinationMetric[];
}
export declare function DestinationOverview(props: DestinationOverviewProps): import("react").JSX.Element;
