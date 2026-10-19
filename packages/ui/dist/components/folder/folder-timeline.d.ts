import { type DomainFrameProps } from '../../internal/domain.js';
import type { FolderActivity } from './types.js';
export interface FolderTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly FolderActivity[];
    emptyMessage?: string;
}
export declare function FolderTimeline(props: FolderTimelineProps): import("react").JSX.Element;
