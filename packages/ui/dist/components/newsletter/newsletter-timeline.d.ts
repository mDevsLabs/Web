import { type DomainFrameProps } from '../../internal/domain.js';
import type { NewsletterActivity } from './types.js';
export interface NewsletterTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly NewsletterActivity[];
    emptyMessage?: string;
}
export declare function NewsletterTimeline(props: NewsletterTimelineProps): import("react").JSX.Element;
