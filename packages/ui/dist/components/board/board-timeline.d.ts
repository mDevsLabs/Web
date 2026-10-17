import { type DomainFrameProps } from '../../internal/domain.js';
import type { BoardActivity } from './types.js';
export interface BoardTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly BoardActivity[];
    emptyMessage?: string;
}
export declare function BoardTimeline(props: BoardTimelineProps): import("react").JSX.Element;
