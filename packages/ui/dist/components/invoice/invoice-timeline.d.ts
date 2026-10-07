import { type DomainFrameProps } from '../../internal/domain.js';
import type { InvoiceActivity } from './types.js';
export interface InvoiceTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly InvoiceActivity[];
    emptyMessage?: string;
}
export declare function InvoiceTimeline(props: InvoiceTimelineProps): import("react").JSX.Element;
