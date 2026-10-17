import { type DomainFrameProps } from '../../internal/domain.js';
import type { ContactActivity } from './types.js';
export interface ContactTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ContactActivity[];
    emptyMessage?: string;
}
export declare function ContactTimeline(props: ContactTimelineProps): import("react").JSX.Element;
