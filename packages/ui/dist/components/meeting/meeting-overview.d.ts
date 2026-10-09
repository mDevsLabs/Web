import { type DomainFrameProps } from '../../internal/domain.js';
import type { Meeting, MeetingMetric } from './types.js';
export interface MeetingOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Meeting[];
    metrics: readonly MeetingMetric[];
}
export declare function MeetingOverview(props: MeetingOverviewProps): import("react").JSX.Element;
