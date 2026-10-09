// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Campaign, CampaignStatus, CampaignActivity, CampaignMetric, CampaignSettingsValues } from './types.js';
export interface CampaignOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Campaign[];
    metrics: readonly CampaignMetric[];
}
export function CampaignOverview(props: CampaignOverviewProps) { return <DomainOverview config={config} {...props}/>; }
