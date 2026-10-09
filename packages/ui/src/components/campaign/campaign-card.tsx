// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Campaign, CampaignStatus, CampaignActivity, CampaignMetric, CampaignSettingsValues } from './types.js';
export interface CampaignCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Campaign;
}
export function CampaignCard(props: CampaignCardProps) { return <DomainCard config={config} {...props}/>; }
