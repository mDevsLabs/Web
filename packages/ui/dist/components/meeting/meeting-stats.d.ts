import { type DomainFrameProps } from '../../internal/domain.js';
import type { MeetingMetric } from './types.js';
export interface MeetingStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly MeetingMetric[];
}
export declare function MeetingStats(props: MeetingStatsProps): import("react").JSX.Element;
