import { type DomainFrameProps } from '../../internal/domain.js';
import type { SavedFilterActivity } from './types.js';
export interface SavedFilterTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly SavedFilterActivity[];
    emptyMessage?: string;
}
export declare function SavedFilterTimeline(props: SavedFilterTimelineProps): import("react").JSX.Element;
