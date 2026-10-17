import { type DomainFrameProps } from '../../internal/domain.js';
import type { MediaAssetActivity } from './types.js';
export interface MediaAssetTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly MediaAssetActivity[];
    emptyMessage?: string;
}
export declare function MediaAssetTimeline(props: MediaAssetTimelineProps): import("react").JSX.Element;
