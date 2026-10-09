import { type DomainFrameProps } from '../../internal/domain.js';
import type { IntegrationActivity } from './types.js';
export interface IntegrationTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly IntegrationActivity[];
    emptyMessage?: string;
}
export declare function IntegrationTimeline(props: IntegrationTimelineProps): import("react").JSX.Element;
