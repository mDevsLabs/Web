import { type DomainFrameProps } from '../../internal/domain.js';
import type { GiftCardActivity } from './types.js';
export interface GiftCardTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly GiftCardActivity[];
    emptyMessage?: string;
}
export declare function GiftCardTimeline(props: GiftCardTimelineProps): import("react").JSX.Element;
