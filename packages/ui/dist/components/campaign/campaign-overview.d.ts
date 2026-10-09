import { type DomainFrameProps } from '../../internal/domain.js';
import type { Campaign, CampaignMetric } from './types.js';
export interface CampaignOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Campaign[];
    metrics: readonly CampaignMetric[];
}
export declare function CampaignOverview(props: CampaignOverviewProps): import("react").JSX.Element;
