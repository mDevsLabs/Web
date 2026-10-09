import { type DomainFrameProps } from '../../internal/domain.js';
import type { ApiEndpoint, ApiEndpointMetric } from './types.js';
export interface ApiEndpointOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly ApiEndpoint[];
    metrics: readonly ApiEndpointMetric[];
}
export declare function ApiEndpointOverview(props: ApiEndpointOverviewProps): import("react").JSX.Element;
