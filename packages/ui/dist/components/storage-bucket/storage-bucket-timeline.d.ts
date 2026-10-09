import { type DomainFrameProps } from '../../internal/domain.js';
import type { StorageBucketActivity } from './types.js';
export interface StorageBucketTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly StorageBucketActivity[];
    emptyMessage?: string;
}
export declare function StorageBucketTimeline(props: StorageBucketTimelineProps): import("react").JSX.Element;
