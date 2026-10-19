import { type DomainFrameProps } from '../../internal/domain.js';
import type { CampaignMetric } from './types.js';
export interface CampaignStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly CampaignMetric[];
}
export declare function CampaignStats(props: CampaignStatsProps): import("react").JSX.Element;
