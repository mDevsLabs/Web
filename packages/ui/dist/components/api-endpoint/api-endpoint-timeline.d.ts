import { type DomainFrameProps } from '../../internal/domain.js';
import type { ApiEndpointActivity } from './types.js';
export interface ApiEndpointTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ApiEndpointActivity[];
    emptyMessage?: string;
}
export declare function ApiEndpointTimeline(props: ApiEndpointTimelineProps): import("react").JSX.Element;
