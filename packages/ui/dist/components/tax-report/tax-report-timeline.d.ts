import { type DomainFrameProps } from '../../internal/domain.js';
import type { TaxReportActivity } from './types.js';
export interface TaxReportTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly TaxReportActivity[];
    emptyMessage?: string;
}
export declare function TaxReportTimeline(props: TaxReportTimelineProps): import("react").JSX.Element;
