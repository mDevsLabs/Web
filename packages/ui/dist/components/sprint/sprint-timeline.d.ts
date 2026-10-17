import { type DomainFrameProps } from '../../internal/domain.js';
import type { SprintActivity } from './types.js';
export interface SprintTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly SprintActivity[];
    emptyMessage?: string;
}
export declare function SprintTimeline(props: SprintTimelineProps): import("react").JSX.Element;
