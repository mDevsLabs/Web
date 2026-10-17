import { type DomainFrameProps } from '../../internal/domain.js';
import type { WorkspaceActivity } from './types.js';
export interface WorkspaceTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly WorkspaceActivity[];
    emptyMessage?: string;
}
export declare function WorkspaceTimeline(props: WorkspaceTimelineProps): import("react").JSX.Element;
