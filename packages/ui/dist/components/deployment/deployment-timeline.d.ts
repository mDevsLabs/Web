import { type DomainFrameProps } from '../../internal/domain.js';
import type { DeploymentActivity } from './types.js';
export interface DeploymentTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly DeploymentActivity[];
    emptyMessage?: string;
}
export declare function DeploymentTimeline(props: DeploymentTimelineProps): import("react").JSX.Element;
