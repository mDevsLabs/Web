import { type DomainFrameProps } from '../../internal/domain.js';
import type { CollectionActivity } from './types.js';
export interface CollectionTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly CollectionActivity[];
    emptyMessage?: string;
}
export declare function CollectionTimeline(props: CollectionTimelineProps): import("react").JSX.Element;
