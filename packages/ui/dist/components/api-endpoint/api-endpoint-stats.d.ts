import { type DomainFrameProps } from '../../internal/domain.js';
import type { ApiEndpointMetric } from './types.js';
export interface ApiEndpointStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ApiEndpointMetric[];
}
export declare function ApiEndpointStats(props: ApiEndpointStatsProps): import("react").JSX.Element;
