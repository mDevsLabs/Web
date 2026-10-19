import { type DomainFrameProps } from '../../internal/domain.js';
import type { QuoteActivity } from './types.js';
export interface QuoteTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly QuoteActivity[];
    emptyMessage?: string;
}
export declare function QuoteTimeline(props: QuoteTimelineProps): import("react").JSX.Element;
