import { type DomainFrameProps } from '../../internal/domain.js';
import type { EnvironmentActivity } from './types.js';
export interface EnvironmentTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly EnvironmentActivity[];
    emptyMessage?: string;
}
export declare function EnvironmentTimeline(props: EnvironmentTimelineProps): import("react").JSX.Element;
