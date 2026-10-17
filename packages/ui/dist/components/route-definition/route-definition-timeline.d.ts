import { type DomainFrameProps } from '../../internal/domain.js';
import type { RouteDefinitionActivity } from './types.js';
export interface RouteDefinitionTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly RouteDefinitionActivity[];
    emptyMessage?: string;
}
export declare function RouteDefinitionTimeline(props: RouteDefinitionTimelineProps): import("react").JSX.Element;
