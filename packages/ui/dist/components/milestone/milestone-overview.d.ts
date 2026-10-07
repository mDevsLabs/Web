import { type DomainFrameProps } from '../../internal/domain.js';
import type { Milestone, MilestoneMetric } from './types.js';
export interface MilestoneOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Milestone[];
    metrics: readonly MilestoneMetric[];
}
export declare function MilestoneOverview(props: MilestoneOverviewProps): import("react").JSX.Element;
