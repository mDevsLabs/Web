// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Campaign, CampaignStatus, CampaignActivity, CampaignMetric, CampaignSettingsValues } from './types.js';
export interface CampaignStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly CampaignMetric[];
}
export function CampaignStats(props: CampaignStatsProps) { return <DomainStats config={config} {...props}/>; }
