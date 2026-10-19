import { type DomainFrameProps } from '../../internal/domain.js';
import type { MilestoneMetric } from './types.js';
export interface MilestoneStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly MilestoneMetric[];
}
export declare function MilestoneStats(props: MilestoneStatsProps): import("react").JSX.Element;
