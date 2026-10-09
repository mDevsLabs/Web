import { type DomainFrameProps } from '../../internal/domain.js';
import type { ReviewActivity } from './types.js';
export interface ReviewTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ReviewActivity[];
    emptyMessage?: string;
}
export declare function ReviewTimeline(props: ReviewTimelineProps): import("react").JSX.Element;
